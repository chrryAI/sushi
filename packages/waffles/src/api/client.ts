import { type APIRequestContext, request } from "@playwright/test"

export class APIClient {
  private context: APIRequestContext | null = null
  private baseURL: string
  private token?: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async init() {
    this.context = await request.newContext({
      baseURL: this.baseURL,
    })
  }

  async authenticate(email: string, password: string) {
    if (!this.context) {
      throw new Error("Client not initialized. Call init() first.")
    }

    const response = await this.context.post("/api/auth/signin/password", {
      data: { email, password },
    })

    if (!response.ok()) {
      const error = await response.text()
      throw new Error(`Authentication failed: ${error}`)
    }

    const data = await response.json()
    this.token = data.token
    return data
  }

  async get(path: string, options?: { params?: Record<string, string> }) {
    if (!this.context) {
      throw new Error("Client not initialized. Call init() first.")
    }

    return this.context.get(path, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      params: options?.params,
    })
  }

  async post(path: string, data?: unknown) {
    if (!this.context) {
      throw new Error("Client not initialized. Call init() first.")
    }

    return this.context.post(path, {
      data,
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    })
  }

  async patch(path: string, data: unknown) {
    if (!this.context) {
      throw new Error("Client not initialized. Call init() first.")
    }

    return this.context.patch(path, {
      data,
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    })
  }

  async delete(path: string) {
    if (!this.context) {
      throw new Error("Client not initialized. Call init() first.")
    }

    return this.context.delete(path, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    })
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose()
      this.context = null
    }
  }
}
