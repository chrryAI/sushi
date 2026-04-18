import { useCallback, useEffect, useState } from "react"
import { BrowserInstance, checkIsExtension } from "../utils"
import console from "../utils/log"

export default function useLocalStorage<T>(
  keyAs: string,
  initialValue: T | (() => T),
) {
  // const [deviceId] = useLocal("deviceId", "")
  // const prefix = deviceId
  const key = keyAs
  //  const key = prefix
  //   ? `🍒-${prefix}-${keyAs}`
  //   : keyAs

  const [storedValue, setStoredValue] = useState<T>(
    initialValue instanceof Function ? initialValue() : initialValue,
  )

  useEffect(() => {
    if (!key || typeof window === "undefined") return

    const loadInitial = () => {
      if (window.localStorage) {
        try {
          const item = window.localStorage.getItem(key)
          if (item !== null && item !== "undefined") {
            try {
              const parsedItem = JSON.parse(item)
              if (parsedItem !== null) {
                setStoredValue(parsedItem as T)
                return
              }
            } catch {
              setStoredValue(item as T)
              return
            }
          }
        } catch (error) {
          console.error("Error reading initial localStorage:", error)
        }
      }
      // Reset to initial value if no stored value found
      const defaultValue =
        initialValue instanceof Function ? initialValue() : initialValue
      setStoredValue(defaultValue)
    }
    loadInitial()
  }, [key])

  const isExtension = checkIsExtension()

  useEffect(() => {
    if (!key) return

    const loadValue = async () => {
      try {
        if (isExtension && BrowserInstance?.storage?.local) {
          // Add additional safety checks
          const result = await BrowserInstance.storage.local?.get(key)

          // Make sure result is a valid object
          if (result && typeof result === "object" && !Array.isArray(result)) {
            const storedItem = result[key]

            if (storedItem !== undefined && storedItem !== null) {
              setStoredValue(storedItem as T)
              return // Early return to prevent fallback
            }
          }

          // Fallback to initial value if no valid stored item
          const defaultValue =
            initialValue instanceof Function ? initialValue() : initialValue
          setStoredValue(defaultValue)
        } else if (typeof window !== "undefined" && window.localStorage) {
          // Regular localStorage logic
          const item = window.localStorage.getItem(key)

          if (item !== null && item !== "undefined") {
            try {
              // Try to parse as JSON first
              const parsedItem = JSON.parse(item)
              if (parsedItem !== null) {
                setStoredValue(parsedItem as T)
              } else {
                const defaultValue =
                  initialValue instanceof Function
                    ? initialValue()
                    : initialValue
                setStoredValue(defaultValue)
              }
            } catch (_parseError) {
              // If JSON parsing fails, use the value as-is (plain string)
              // This handles values stored without JSON.stringify (like next-themes)
              setStoredValue(item as T)
            }
          } else {
            const defaultValue =
              initialValue instanceof Function ? initialValue() : initialValue
            setStoredValue(defaultValue)
          }
        }
      } catch (error) {
        console.error("Error loading from storage:", error)
        const defaultValue =
          initialValue instanceof Function ? initialValue() : initialValue
        setStoredValue(defaultValue)
      }
    }

    loadValue()
  }, [key])

  const setValue = useCallback(
    async (value: T | ((t: T) => T)) => {
      // if (!key) return value
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value

        if (valueToStore === undefined) {
          return
        }

        setStoredValue(valueToStore)

        if (isExtension && BrowserInstance?.storage?.local) {
          // Add safety check before setting
          try {
            await BrowserInstance.storage.local?.set({ [key]: valueToStore })
            console.log(
              `Successfully stored ${key} in extension storage`,
              await BrowserInstance.storage.local.get(key),
            )
          } catch (storageError) {
            console.error("Extension storage error:", storageError)
            // Fallback to localStorage if extension storage fails
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
          }
        } else if (typeof window !== "undefined" && window.localStorage) {
          // Store simple strings without JSON.stringify to maintain compatibility with next-themes
          const stringValue =
            typeof valueToStore === "string"
              ? valueToStore
              : JSON.stringify(valueToStore)
          window.localStorage.setItem(key, stringValue)
        }
      } catch (error) {
        console.error("Error saving to storage:", error)
      }
    },
    [key],
  )

  return [storedValue, setValue] as const
}
