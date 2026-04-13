import { createCalendarEvent, type user } from "../../index"

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

export const createEvent = async ({ user }: { user: user }) => {
  // Create mock calendar events for admin
  console.log("📅 Creating calendar events...")

  // Past events
  await createCalendarEvent({
    userId: user.id,
    title: "Team Meeting - Amsterdam Office",
    startTime: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endTime: new Date(
      today.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    ), // 2 hours
    description:
      "Quarterly review meeting with the Amsterdam team.\n\nAgenda:\n- Q4 results\n- 2025 roadmap\n- Team updates",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Client Presentation - Istanbul",
    startTime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    endTime: new Date(
      today.getTime() - 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000,
    ), // 90 mins
    description:
      "Product demo for Turkish market expansion.\n\nKey points:\n- Market analysis\n- Localization strategy\n- Partnership opportunities",
    location: "Istanbul, Turkey",
    color: "orange",
    timezone: "Europe/Istanbul",
    status: "confirmed",
    visibility: "private",
  })

  // Today's events
  await createCalendarEvent({
    userId: user.id,
    title: "Coffee Chat",
    startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // Today at 10 AM
    endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 1 hour
    description: "Casual catch-up with the team ☕",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Product Review",
    startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // Today at 2 PM
    endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1.5 hours
    description:
      "Review latest features and plan next sprint.\n\nTopics:\n- Calendar integration ✅\n- Memory system improvements\n- Character profiles",
    location: "Amsterdam, Netherlands",
    color: "violet",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Future events
  await createCalendarEvent({
    userId: user.id,
    title: "Conference - Tokyo Tech Summit",
    startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    endTime: new Date(
      today.getTime() + 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000,
    ), // Full day
    description:
      "Annual tech conference in Tokyo.\n\nSpeaking about AI innovation and the future of conversational AI.\n\nWebsite: https://tokyotechsummit.com",
    location: "Tokyo, Japan",
    color: "red",
    timezone: "Asia/Tokyo",
    status: "confirmed",
    visibility: "public",
    isAllDay: false,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Workshop - AI Integration",
    startTime: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endTime: new Date(
      today.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    ), // 4 hours
    description:
      "Hands-on workshop teaching developers how to integrate AI into their applications.\n\nTopics:\n- API integration\n- Best practices\n- Real-world examples\n\nRegister: https://workshop.example.com",
    location: "Istanbul, Turkey",
    color: "blue",
    timezone: "Europe/Istanbul",
    status: "confirmed",
    visibility: "public",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Team Offsite - Amsterdam",
    startTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    endTime: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000), // 3 days
    description:
      "Annual team building event.\n\nActivities:\n- Strategy planning\n- Team workshops\n- Social events\n- Dinner cruise 🚢",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
    isAllDay: true,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Investor Meeting",
    startTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    endTime: new Date(
      today.getTime() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    ), // 2 hours
    description:
      "Q1 investor update and funding discussion.\n\nPresenting:\n- Growth metrics\n- Product roadmap\n- Market expansion plans",
    location: "Amsterdam, Netherlands",
    color: "purple",
    timezone: "Europe/Amsterdam",
    status: "tentative",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Birthday Party 🎉",
    startTime: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
    endTime: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // All day
    description: "Celebrating another year! 🎂🎈",
    location: "Amsterdam, Netherlands",
    color: "orange",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
    isAllDay: true,
  })

  // More past events
  await createCalendarEvent({
    userId: user.id,
    title: "Design Sprint - Tokyo",
    startTime: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    endTime: new Date(
      today.getTime() - 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000,
    ),
    description:
      "Product design sprint with Tokyo team.\n\nFocus areas:\n- Mobile app redesign\n- User onboarding flow\n- Accessibility improvements",
    location: "Tokyo, Japan",
    color: "violet",
    timezone: "Asia/Tokyo",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() - 10 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 10 days ago, 9 AM
    endTime: new Date(
      today.getTime() - 10 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Lunch with Investors",
    startTime: new Date(
      today.getTime() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ), // 5 days ago, noon
    endTime: new Date(
      today.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000,
    ),
    description: "Casual lunch meeting to discuss funding opportunities",
    location: "Istanbul, Turkey",
    color: "orange",
    timezone: "Europe/Istanbul",
    status: "confirmed",
    visibility: "private",
  })

  // This week's events
  await createCalendarEvent({
    userId: user.id,
    title: "1-on-1 with CTO",
    startTime: new Date(
      today.getTime() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000,
    ), // 2 days ago, 3 PM
    endTime: new Date(
      today.getTime() - 2 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000,
    ),
    description: "Monthly check-in with CTO",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Marketing Strategy Session",
    startTime: new Date(
      today.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ), // Yesterday, 10 AM
    endTime: new Date(
      today.getTime() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ),
    description:
      "Q1 marketing campaign planning.\n\nTopics:\n- Social media strategy\n- Content calendar\n- Partnership opportunities",
    location: "Amsterdam, Netherlands",
    color: "purple",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Next week
  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // Tomorrow, 9 AM
    endTime: new Date(
      today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Customer Success Review",
    startTime: new Date(
      today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000,
    ), // 2 days, 2 PM
    endTime: new Date(
      today.getTime() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000,
    ),
    description: "Monthly customer metrics review",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Podcast Recording",
    startTime: new Date(
      today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000,
    ), // 3 days, 4 PM
    endTime: new Date(
      today.getTime() + 3 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000,
    ),
    description:
      "Guest appearance on Tech Talks podcast.\n\nTopic: The Future of AI Assistants\n\nLink: https://techtalkspodcast.com",
    location: "Amsterdam, Netherlands",
    color: "red",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "public",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Gym Session 💪",
    startTime: new Date(
      today.getTime() + 4 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000,
    ), // 4 days, 7 AM
    endTime: new Date(
      today.getTime() + 4 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000,
    ),
    description: "Morning workout session",
    location: "Amsterdam, Netherlands",
    color: "orange",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Week 2
  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 8 days, 9 AM
    endTime: new Date(
      today.getTime() + 8 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Board Meeting",
    startTime: new Date(
      today.getTime() + 9 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ), // 9 days, 10 AM
    endTime: new Date(
      today.getTime() + 9 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ),
    description:
      "Quarterly board meeting.\n\nAgenda:\n- Financial review\n- Strategic initiatives\n- Q&A",
    location: "Amsterdam, Netherlands",
    color: "purple",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Hackathon - Istanbul Tech Week",
    startTime: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days
    endTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 days
    description:
      "48-hour hackathon event.\n\nTheme: AI for Social Good\n\nPrizes: $50,000 total\n\nWebsite: https://istanbultechweek.com",
    location: "Istanbul, Turkey",
    color: "red",
    timezone: "Europe/Istanbul",
    status: "confirmed",
    visibility: "public",
    isAllDay: true,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 15 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 15 days, 9 AM
    endTime: new Date(
      today.getTime() + 15 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Week 3
  await createCalendarEvent({
    userId: user.id,
    title: "Product Launch Webinar",
    startTime: new Date(
      today.getTime() + 17 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000,
    ), // 17 days, 2 PM
    endTime: new Date(
      today.getTime() + 17 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000,
    ),
    description:
      "Live webinar showcasing new features.\n\nRegister: https://webinar.vex.com",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "public",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Team Dinner 🍽️",
    startTime: new Date(
      today.getTime() + 18 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000,
    ), // 18 days, 7 PM
    endTime: new Date(
      today.getTime() + 18 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000,
    ),
    description: "Team celebration dinner at De Kas restaurant",
    location: "Amsterdam, Netherlands",
    color: "orange",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 22 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 22 days, 9 AM
    endTime: new Date(
      today.getTime() + 22 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Security Audit",
    startTime: new Date(
      today.getTime() + 23 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ), // 23 days, 10 AM
    endTime: new Date(
      today.getTime() + 23 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ),
    description: "Quarterly security review with external auditors",
    location: "Amsterdam, Netherlands",
    color: "red",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Week 4
  await createCalendarEvent({
    userId: user.id,
    title: "Tokyo Office Opening 🎊",
    startTime: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days
    endTime: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000),
    description:
      "Grand opening of our Tokyo office!\n\nCelebration event with team, partners, and local community.",
    location: "Tokyo, Japan",
    color: "red",
    timezone: "Asia/Tokyo",
    status: "confirmed",
    visibility: "public",
    isAllDay: true,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Press Conference - Tokyo",
    startTime: new Date(
      today.getTime() + 26 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000,
    ), // 26 days, 11 AM
    endTime: new Date(
      today.getTime() + 26 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ),
    description: "Press conference announcing Tokyo expansion",
    location: "Tokyo, Japan",
    color: "purple",
    timezone: "Asia/Tokyo",
    status: "confirmed",
    visibility: "public",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 29 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 29 days, 9 AM
    endTime: new Date(
      today.getTime() + 29 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Month 2
  await createCalendarEvent({
    userId: user.id,
    title: "All-Hands Meeting",
    startTime: new Date(
      today.getTime() + 35 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ), // 35 days, 10 AM
    endTime: new Date(
      today.getTime() + 35 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000,
    ),
    description:
      "Monthly all-hands company meeting.\n\nTopics:\n- Company updates\n- Team highlights\n- Q&A session",
    location: "Amsterdam, Netherlands",
    color: "violet",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 36 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 36 days, 9 AM
    endTime: new Date(
      today.getTime() + 36 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Yoga Class 🧘",
    startTime: new Date(
      today.getTime() + 37 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000,
    ), // 37 days, 6 PM
    endTime: new Date(
      today.getTime() + 37 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000,
    ),
    description: "Evening yoga session",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Partnership Meeting - Istanbul",
    startTime: new Date(
      today.getTime() + 40 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000,
    ), // 40 days, 1 PM
    endTime: new Date(
      today.getTime() + 40 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000,
    ),
    description: "Exploring strategic partnerships in Turkish market",
    location: "Istanbul, Turkey",
    color: "orange",
    timezone: "Europe/Istanbul",
    status: "tentative",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 43 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 43 days, 9 AM
    endTime: new Date(
      today.getTime() + 43 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Code Review Session",
    startTime: new Date(
      today.getTime() + 44 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000,
    ), // 44 days, 2 PM
    endTime: new Date(
      today.getTime() + 44 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000,
    ),
    description: "Team code review and architecture discussion",
    location: "Amsterdam, Netherlands",
    color: "violet",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "User Research Session",
    startTime: new Date(
      today.getTime() + 47 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ), // 47 days, 10 AM
    endTime: new Date(
      today.getTime() + 47 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    ),
    description: "User interviews and feedback sessions",
    location: "Amsterdam, Netherlands",
    color: "green",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 50 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 50 days, 9 AM
    endTime: new Date(
      today.getTime() + 50 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  // Month 3
  await createCalendarEvent({
    userId: user.id,
    title: "AI Summit - Tokyo",
    startTime: new Date(today.getTime() + 55 * 24 * 60 * 60 * 1000), // 55 days
    endTime: new Date(today.getTime() + 57 * 24 * 60 * 60 * 1000), // 3 days
    description:
      "Asia's largest AI conference.\n\nKeynote speaker on Day 2\n\nWebsite: https://aisummit.tokyo",
    location: "Tokyo, Japan",
    color: "red",
    timezone: "Asia/Tokyo",
    status: "confirmed",
    visibility: "public",
    isAllDay: true,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 57 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 57 days, 9 AM
    endTime: new Date(
      today.getTime() + 57 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Quarterly Business Review",
    startTime: new Date(
      today.getTime() + 60 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 60 days, 9 AM
    endTime: new Date(
      today.getTime() + 60 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000,
    ), // Full day
    description:
      "Q2 business review with all departments.\n\nAgenda:\n- Revenue analysis\n- Product roadmap\n- Team performance\n- Strategic planning",
    location: "Amsterdam, Netherlands",
    color: "purple",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 64 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 64 days, 9 AM
    endTime: new Date(
      today.getTime() + 64 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Charity Gala - Istanbul",
    startTime: new Date(
      today.getTime() + 68 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000,
    ), // 68 days, 7 PM
    endTime: new Date(
      today.getTime() + 68 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000,
    ),
    description: "Annual charity gala supporting tech education in Turkey",
    location: "Istanbul, Turkey",
    color: "orange",
    timezone: "Europe/Istanbul",
    status: "confirmed",
    visibility: "public",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 71 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 71 days, 9 AM
    endTime: new Date(
      today.getTime() + 71 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Company Retreat 🏖️",
    startTime: new Date(today.getTime() + 75 * 24 * 60 * 60 * 1000), // 75 days
    endTime: new Date(today.getTime() + 79 * 24 * 60 * 60 * 1000), // 5 days
    description:
      "Annual company retreat in Greece.\n\nActivities:\n- Team building\n- Strategy sessions\n- Relaxation time\n- Beach activities",
    location: "Santorini, Greece",
    color: "green",
    timezone: "Europe/Athens",
    status: "confirmed",
    visibility: "private",
    isAllDay: true,
  })

  await createCalendarEvent({
    userId: user.id,
    title: "Weekly Standup",
    startTime: new Date(
      today.getTime() + 78 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
    ), // 78 days, 9 AM
    endTime: new Date(
      today.getTime() + 78 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
    ),
    description: "Weekly team sync-up",
    location: "Amsterdam, Netherlands",
    color: "blue",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  await createCalendarEvent({
    userId: user.id,
    title: "End of Quarter Celebration 🎉",
    startTime: new Date(
      today.getTime() + 85 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000,
    ), // 85 days, 6 PM
    endTime: new Date(
      today.getTime() + 85 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000,
    ),
    description:
      "Team celebration for successful quarter!\n\nVenue: Rooftop bar with canal views",
    location: "Amsterdam, Netherlands",
    color: "orange",
    timezone: "Europe/Amsterdam",
    status: "confirmed",
    visibility: "private",
  })

  console.log("✅ Calendar events created (50+ events across 3 months)")
}
