/**
 * Cross-platform useLocalStorage hook
 * Uses platform storage (localStorage on web, MMKV on native)
 */

import { useCallback, useEffect, useState } from "react"
import { storage } from "./storage"

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with initial value to match server during hydration
  const [storedValue, setStoredValue] = useState<T>(
    initialValue instanceof Function ? initialValue() : initialValue,
  )

  // Update storage whenever value changes
  useEffect(() => {
    try {
      const item = storage.getItem(key)
      if (item !== null && item !== undefined) {
        setStoredValue(item as T)
      }
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error)
    }
  }, [key])

  // Update storage whenever value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for same API as useState
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value

          // Save to storage
          storage.setItem(key, valueToStore)

          return valueToStore
        })
      } catch (error) {
        console.error(`Error saving ${key} to storage:`, error)
      }
    },
    [key],
  )
  // storedValue removed from deps to prevent infinite loop

  return [storedValue, setValue]
}

export default useLocalStorage
