import type React from "react"
import { useCallback } from "react"
import { toast } from "react-hot-toast"
import { useAppContext } from "../context/AppContext"
import { useAuth } from "../context/providers"
import type { app, sushi } from "../types"
import console from "../utils/log"

interface UseAppReorderProps {
  apps: sushi[]
  setApps: React.Dispatch<React.SetStateAction<sushi[]>>
  onSave?: (apps: sushi[]) => Promise<void>
  autoInstall?: boolean
  storeId?: string // Store context for ordering
}

export function useAppReorder({
  apps,
  setApps,
  onSave,
  autoInstall,
  storeId,
}: UseAppReorderProps) {
  const { t } = useAppContext()

  const { token, actions } = useAuth()
  // Move app during drag (live preview)
  const moveApp = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setApps((prevApps: sushi[]) => {
        const newApps = [...prevApps]
        const draggedApp = newApps[dragIndex]
        if (!draggedApp) return prevApps // Safety check

        newApps.splice(dragIndex, 1)
        newApps.splice(hoverIndex, 0, draggedApp)
        return newApps
      })
    },
    [setApps],
  )

  // Save order to database when drop completes
  const handleDrop = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      console.log(`Dropped app from ${dragIndex} to ${hoverIndex}`)
      if (!token) return
      if (onSave) {
        await onSave(apps)
      } else {
        // Default save implementation
        try {
          // Convert sushi[] to app[] for the API
          const appsToSave = apps.map((appItem) => {
            // Extract app properties, excluding the nested store object
            const { store, ...appData } = appItem
            return appData as app
          })

          const response = await actions.reorderApps(
            appsToSave,
            autoInstall,
            storeId,
          )

          if (response?.error) {
            toast.error(t(response.error))
            return
          }

          console.log("✅ App order saved successfully", response)
          if (response?.message) {
            toast.success(response.message)
          }
        } catch (error) {
          console.error("❌ Failed to save app order:", error)
          toast.error(t("failed_to_save_order"))
        }
      }
    },
    [apps, onSave, token, autoInstall, storeId, actions, t],
  )

  const handleDragStart = useCallback((index: number) => {
    console.log("Started dragging app at index:", index)
  }, [])

  const handleDragEnd = useCallback((index: number) => {
    console.log("Stopped dragging app at index:", index)
  }, [])

  return {
    moveApp,
    handleDrop,
    handleDragStart,
    handleDragEnd,
  }
}
