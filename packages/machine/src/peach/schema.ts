// /**
//  * peach Schema — Her app'in kendi sosyal medya yönetim paneli
//  *
//  * Bu tablolar tribe/posts ile PARALEL çalışır.
//  * Tribe = public social feed
//  * peach = owner'ın yönetim arayüzü (kolonlar + otomasyon)
//  */

// import { relations } from "drizzle-orm"
// import {
//   boolean,
//   index,
//   integer,
//   jsonb,
//   pgEnum,
//   pgTable,
//   text,
//   timestamp,
//   uuid,
// } from "drizzle-orm/pg-core"
// import { apps, guests, tribePosts, users } from "./schema"

// /**
//  * Kolon tipi — hangi içerik bu kolonda görünecek
//  */
// export const columnTypeEnum = pgEnum("peach_column_type", [
//   "feed", // Ana akış (tribe posts, threads)
//   "mentions", // Bahsedilmeler
//   "scheduled", // Planlanmış içerikler
//   "draft", // Taslaklar
//   "analytics", // Performans metrikleri
//   "engagement", // Etkileşimler (likes, comments)
//   "media", // Medya kütüphanesi
//   "ai_generated", // AI tarafından üretilen içerik havuzu
//   "crosspost", // Sosyal medya crosspost yönetimi
//   "custom", // Kullanıcı tanımlı
// ])

// /**
//  * peach Kolonları
//  * Her app sahibi kendi panelinde kolonları oluşturur
//  */
// export const peachColumns = pgTable(
//   "peach_columns",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     appId: uuid("appId")
//       .notNull()
//       .references(() => apps.id, { onDelete: "cascade" }),
//     userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
//     guestId: uuid("guestId").references(() => guests.id, {
//       onDelete: "cascade",
//     }),

//     title: text("title").notNull(), // "📢 Feed", "🤖 AI", "📅 Scheduled"
//     type: columnTypeEnum("type").notNull().default("feed"),
//     position: integer("position").notNull().default(0), // Sıralama

//     // Filtre — hangi içerikler bu kolonda görünsün
//     filter: jsonb("filter")
//       .$type<{
//         postTypes?: string[] // ["text", "image", "video"]
//         tags?: string[] // ["ai", "promo", "update"]
//         status?: string[] // ["published", "draft", "scheduled"]
//         minEngagement?: number // minimum like/comment
//         dateRange?: {
//           // zaman aralığı
//           from?: string
//           to?: string
//         }
//         aiGenerated?: boolean // sadece AI içerik
//         crosspostTargets?: string[] // ["twitter", "instagram", "linkedin"]
//       }>()
//       .default({}),

//     // Görünüm ayarları
//     config: jsonb("config")
//       .$type<{
//         width?: number // kolon genişliği (px)
//         showAvatars?: boolean // avatar göster
//         showStats?: boolean // beğeni/yorum sayısı
//         autoRefresh?: number // otomatik yenileme (saniye)
//         groupBy?: string // "day", "week", "author"
//         compact?: boolean // kompakt görünüm
//       }>()
//       .default({}),

//     // Otomasyon
//     automation: jsonb("automation")
//       .$type<{
//         autoPostEnabled?: boolean // otomatik paylaş
//         autoSchedule?: {
//           // otomatik zamanlama
//           enabled: boolean
//           interval: string // "1h", "3h", "daily", "weekly"
//           timezone: string
//         }
//         aiRules?: {
//           // AI kuralları
//           enabled: boolean
//           prompt: string // "Eğlenceli, 280karakter, hashtagli"
//           maxPerDay: number
//         }
//         crosspost?: {
//           // Oto-crosspost
//           enabled: boolean
//           targets: string[] // ["twitter", "instagram"]
//           delayMinutes: number
//         }
//       }>()
//       .default({}),

//     isActive: boolean("isActive").notNull().default(true),
//     isSystem: boolean("isSystem").notNull().default(false), // Silinemez (varsayılan)

//     createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
//       .defaultNow()
//       .notNull(),
//     updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
//       .defaultNow()
//       .notNull(),
//   },
//   (table) => [
//     index("peach_columns_app_idx").on(table.appId),
//     index("peach_columns_user_idx").on(table.userId),
//   ],
// )

// /**
//  * peach İtem'ları
//  * Kolonlarda gösterilen içerikler (post, thread, media vb.)
//  */
// export const peachItems = pgTable(
//   "peach_items",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     columnId: uuid("columnId")
//       .notNull()
//       .references(() => peachColumns.id, { onDelete: "cascade" }),

//     // Kaynak içerik (bir post, thread veya harici içerik)
//     sourceId: uuid("sourceId"), // tribePosts.id veya threads.id
//     sourceType: text("sourceType", {
//       // "post", "thread", "external"
//       enum: ["post", "thread", "external"],
//     }).notNull(),

//     // Inline içerik (kaynak yoksa doğrudan burada)
//     inlineContent: jsonb("inlineContent").$type<{
//       title?: string
//       body?: string
//       media?: string[]
//       tags?: string[]
//     }>(),

//     // Durum
//     status: text("status", {
//       enum: ["draft", "scheduled", "published", "failed", "archived"],
//     })
//       .notNull()
//       .default("draft"),

//     // Zamanlama
//     scheduledFor: timestamp("scheduledFor", {
//       mode: "date",
//       withTimezone: true,
//     }),
//     publishedOn: timestamp("publishedOn", { mode: "date", withTimezone: true }),

//     // Performans (cached)
//     engagement: jsonb("engagement")
//       .$type<{
//         views?: number
//         likes?: number
//         comments?: number
//         shares?: number
//         clickRate?: number
//       }>()
//       .default({}),

//     createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
//       .defaultNow()
//       .notNull(),
//     updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
//       .defaultNow()
//       .notNull(),
//   },
//   (table) => [
//     index("peach_items_column_idx").on(table.columnId),
//     index("peach_items_status_idx").on(table.status),
//     index("peach_items_scheduled_idx").on(table.scheduledFor),
//   ],
// )

// /**
//  * Crosspost Kayıtları — Sosyal medyaya otomatik paylaşım
//  */
// export const peachCrossposts = pgTable(
//   "peach_crossposts",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     itemId: uuid("itemId")
//       .notNull()
//       .references(() => peachItems.id, { onDelete: "cascade" }),
//     appId: uuid("appId")
//       .notNull()
//       .references(() => apps.id, { onDelete: "cascade" }),

//     // Hedef platform
//     platform: text("platform", {
//       enum: [
//         "twitter",
//         "instagram",
//         "linkedin",
//         "facebook",
//         "tiktok",
//         "youtube",
//         "moltbook",
//       ],
//     }).notNull(),

//     // Platform-specific ID
//     platformPostId: text("platformPostId"),
//     platformUrl: text("platformUrl"),

//     // Durum
//     status: text("status", {
//       enum: ["pending", "published", "failed", "retrying"],
//     })
//       .notNull()
//       .default("pending"),

//     // Hata kaydı
//     errorLog: text("errorLog"),
//     retryCount: integer("retryCount").default(0).notNull(),

//     publishedOn: timestamp("publishedOn", { mode: "date", withTimezone: true }),
//     createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
//       .defaultNow()
//       .notNull(),
//   },
//   (table) => [
//     index("peach_crossposts_item_idx").on(table.itemId),
//     index("peach_crossposts_app_idx").on(table.appId),
//   ],
// )

// /**
//  * Relations
//  */
// export const peachColumnsRelations = relations(
//   peachColumns,
//   ({ many, one }) => ({
//     app: one(apps, {
//       fields: [peachColumns.appId],
//       references: [apps.id],
//     }),
//     items: many(peachItems),
//   }),
// )

// export const peachItemsRelations = relations(peachItems, ({ one }) => ({
//   column: one(peachColumns, {
//     fields: [peachItems.columnId],
//     references: [peachColumns.id],
//   }),
// }))
