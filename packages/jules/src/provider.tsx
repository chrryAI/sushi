"use client"

import { Zero } from "@rocicorp/zero"
import { ZeroProvider as ZReactProvider } from "@rocicorp/zero/react"
import { useMemo } from "react"
import { schema } from "./zero-schema.gen.js"

interface ZeroProviderProps {
  children: React.ReactNode
  server: string
  userID: string
  token?: string
}

export function ZeroProvider({
  children,
  server,
  userID,
  token,
}: ZeroProviderProps) {
  const zero = useMemo(() => {
    if (typeof window === "undefined") return null
    return new Zero({
      server,
      userID,
      schema,
      auth: token,
    })
  }, [server, userID, token])

  if (!zero) {
    return <>{children}</>
  }

  return <ZReactProvider zero={zero}>{children}</ZReactProvider>
}
