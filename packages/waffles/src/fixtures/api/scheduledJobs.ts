import { faker } from "@faker-js/faker"

/**
 * Tribe Schedule Fixture
 * Matches tribeScheduleSchema from @chrryai/donut/schemas/tribeScheduleSchema
 */

// Alias for backward compatibility
export type ScheduledJob = TribeScheduleInput

export interface TribeScheduleInput {
  sessionId?: string
  appId?: string
  schedule: Array<{
    time: string
    postType: string
    model: string
    charLimit: number
    credits: number
    intervalMinutes?: number
    generateImage?: boolean
    generateVideo?: boolean
    fetchNews?: boolean
  }>
  frequency: "once" | "daily" | "weekly" | "custom"
  startDate: string // ISO date string
  endDate?: string // ISO date string
  contentTemplate?: string
  contentRules?: {
    tone?: string
    length?: string
    topics?: string[]
    hashtags?: string[]
  }
  totalCredits: number
  totalPrice: number
  timezone: string
}

export const scheduledJobFactory = {
  build(overrides?: Partial<TribeScheduleInput>): TribeScheduleInput {
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    return {
      // Required fields per tribeScheduleSchema
      frequency: "daily",
      schedule: [
        {
          time: "09:00",
          postType: "post",
          model: "sushi",
          charLimit: 500,
          credits: 10,
          intervalMinutes: 60,
        },
      ],
      timezone: "Europe/Istanbul",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalCredits: 10,
      totalPrice: 500, // Minimum €5 (500 cents)

      // Optional fields
      appId: undefined,
      contentTemplate: faker.lorem.paragraph(),
      contentRules: {
        tone: "friendly",
        length: "medium",
        topics: ["tech", "ai"],
        hashtags: ["#test"],
      },

      ...overrides,
    }
  },

  buildMany(
    count: number,
    overrides?: Partial<TribeScheduleInput>,
  ): TribeScheduleInput[] {
    return Array.from({ length: count }, () => this.build(overrides))
  },
}
