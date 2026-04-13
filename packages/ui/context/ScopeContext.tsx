"use client"

import { createContext, type ReactNode, useContext } from "react"

const ScopeContext = createContext<string | undefined>(undefined)

export function ScopeProvider({
  value,
  children,
}: {
  value: string | undefined
  children: ReactNode
}) {
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}

export function useScope() {
  return useContext(ScopeContext)
}
