import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const baAccounts = pgTable("account", {
  id: uuid("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

export const baSessions = pgTable("session", {
  id: uuid("id").primaryKey(),
  userId: text("userId").notNull(),
  expires: timestamp("expires").notNull(),
  sessionToken: text("sessionToken").notNull(),
})

export const baVerifications = pgTable("verificationToken", {
  id: uuid("id").primaryKey(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
})
