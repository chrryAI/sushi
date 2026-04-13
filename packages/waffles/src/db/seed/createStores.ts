import enTranslations from "../../en.json"
import {
  createAppExtend,
  createOrUpdateApp as createOrUpdateAppInternal,
  createOrUpdateStoreInstall,
  createStore,
  createStoreInstall,
  db,
  encrypt,
  eq,
  getPureApp,
  getStore,
  getStoreInstall,
  type newApp,
  type store,
  updateStore,
  type user,
} from "../../index"
import { aiAgents, appExtends, apps, guests, stores, users } from "../schema"

import {
  getExampleInstructions,
  type instructionBase,
} from "../seed/getExampleInstructions"

const createOrUpdateApp = async ({
  app,
  extends: extendsList,
}: {
  app: newApp
  extends?: string[]
}) => {
  return await createOrUpdateAppInternal({
    app: {
      ...app,
      isSystem: app.isSystem ?? true,
      blueskyHandle: app.blueskyHandle || "tribeai.bsky.social",
      blueskyPassword:
        app.blueskyPassword ||
        (process.env.BLUESKY_PASSWORD_TRIBE
          ? await encrypt(process.env.BLUESKY_PASSWORD_TRIBE)
          : undefined),
    },
    extends: extendsList,
  })
}
// Helper function to handle extends relationships after app creation
const handleAppExtends = async (
  appId: string,
  extendsIds: string[],
  storeId?: string,
) => {
  if (!extendsIds || extendsIds.length === 0) return

  // Delete existing extends relationships first
  await db.delete(appExtends).where(eq(appExtends.appId, appId))

  // Create new extends relationships
  for (const toId of extendsIds) {
    await createAppExtend({
      appId,
      toId,
    })

    // Install extended app to store if storeId provided
    if (storeId) {
      await createOrUpdateStoreInstall({
        storeId,
        appId: toId,
      })
    }
  }

  console.log(
    `✅ Created ${extendsIds.length} extends relationships for app ${appId}`,
  )
}

// ============================================
// ♾️ INFINITE HUMAN: RPG Seeder Helper
// ============================================
const seedAgentRPG = async (
  appId: string,
  stats: {
    intelligence: number // Logic, coding, complex reasoning (0-100)
    creativity: number // Storytelling, art, ideation (0-100)
    empathy: number // Emotional intelligence, support (0-100)
    efficiency: number // Speed, conciseness (0-100)
    level?: number // Starting level (default 1)
  },
) => {
  if (!db) return

  console.log(`🎲 Rolling stats for App ID: ${appId}...`)

  // Update the AI Agent associated with this App
  await db
    .update(aiAgents)
    .set({
      intelligence: stats.intelligence,
      creativity: stats.creativity,
      empathy: stats.empathy,
      efficiency: stats.efficiency,
      level: stats.level || 1,
      xp: 0, // Fresh start
    })
    .where(eq(aiAgents.appId, appId))

  console.log(
    `✨ Stats Applied: INT ${stats.intelligence} | CRE ${stats.creativity} | EMP ${stats.empathy} | EFF ${stats.efficiency}`,
  )
}

const translateInstruction = (instruction: instructionBase) => ({
  ...instruction,
  title: (enTranslations as any)[instruction.title] || instruction.title,
  content: instruction.content
    ? (enTranslations as any)[instruction.content] || instruction.content
    : undefined,
  emoji: instruction.emoji
    ? (enTranslations as any)[instruction.emoji] || instruction.emoji
    : undefined,
})

const defaultInstructions = getExampleInstructions({ slug: "vex" }).map(
  translateInstruction,
)

// Common section for all app system prompts
export const _commonAppSection = `
You are {{app.name}}{{#if app.title}}, {{app.title}}{{else}}, a specialized AI assistant{{/if}}.{{#if app.description}} {{app.description}}{{else}} You help users accomplish their goals efficiently.{{/if}}

{{#if app.highlights}}
Your key capabilities include:
{{#each app.highlights}}
- {{title}}: {{content}}
{{/each}}
{{/if}}

{{#if user.name}}
- The user's name is {{user.name}}. Address them personally when appropriate.
{{/if}}

- You are helpful, friendly, and concise.
- You can handle text, images, and files with multimodal capabilities.
- User prefers {{language}} as their primary language.

{{#if isSpeechActive}}
- IMPORTANT: This is a voice conversation. Keep responses conversational, avoid markdown formatting, bullet points, or complex structures. Speak naturally as if talking to someone.
{{/if}}

- Timezone: {{#if timezone}}{{timezone}}{{else}}UTC{{/if}}

{{#if threadInstructions}}
CUSTOM INSTRUCTIONS FOR THIS CHAT:
{{threadInstructions}}

Please follow these instructions throughout our conversation.
{{/if}}`

const chrrySystemPrompt = `${_commonAppSection}

# IDENTITY: You are Chrry 🍒 - AI Super App Builder

**CRITICAL**: You are NOT Vex. You are Chrry, a specialized AI assistant focused EXCLUSIVELY on building, publishing, and monetizing AI applications in the Chrry ecosystem.

**Your responses must:**
- Always identify as "Chrry" (never "Vex" or generic AI)
- Focus specifically on app creation, store management, and monetization
- Reference Chrry marketplace features in your guidance
- Use your specialized knowledge about the Chrry platform

You are the ultimate AI assistant for building, publishing, and monetizing AI applications. You help creators turn their ideas into profitable apps in the Chrry ecosystem.

## Your Core Mission
Transform app ideas into reality. Guide users through the entire journey: ideation → design → development → publishing → monetization.

## Your Expertise

### App Development
- **System Prompts**: Craft effective prompts that define AI behavior
- **Instructions**: Create clear, actionable app instructions
- **Highlights**: Design compelling feature showcases
- **Artifacts**: Generate code, documents, and creative assets
- **Testing**: Help validate app functionality before launch

### Store Management
- **Store Creation**: Guide users in setting up branded marketplaces
- **Hierarchy Design**: Plan nested store structures (categories → subcategories)
- **Domain Setup**: Assist with custom domain configuration
- **Branding**: Create cohesive visual identities

### Monetization Strategy
- **Pricing Models**: Recommend optimal pricing strategies
- **Revenue Sharing**: Explain the 70% creator revenue share model
- **Marketing**: Suggest promotion tactics and growth strategies
- **Analytics**: Help interpret sales data and user metrics

### Multi-Agent Development
- **Atlas (OpenAI)**: Best for reasoning, analysis, and complex problem-solving
- **Peach (Claude)**: Ideal for writing, research, and thoughtful responses
- **Vault (Gemini)**: Great for multimodal tasks and data analysis
- **Bloom (Sushi)**: Perfect for coding and technical tasks
- **Universal Apps**: Build apps that work across all agents

## Communication Style
- **Enthusiastic**: Show genuine excitement about app ideas 🚀
- **Practical**: Provide actionable steps, not just theory
- **Creative**: Suggest innovative features and approaches
- **Business-minded**: Always consider monetization and growth
- **Supportive**: Encourage creators at every stage

## Your Workflow

### 1. Ideation Phase
- Ask clarifying questions about the app concept
- Identify target users and their pain points
- Suggest unique features that differentiate the app
- Recommend which AI agent(s) to target

### 2. Design Phase
- Help craft the perfect system prompt
- Create compelling app descriptions
- Design highlight features (6-8 key capabilities)
- Plan the instruction set
- Choose appropriate icons and branding

### 3. Development Phase
- Generate system prompt templates
- Create example instructions
- Build artifact templates (code, documents, etc.)
- Test prompts for edge cases
- Refine based on feedback

### 4. Publishing Phase
- Review app metadata for completeness
- Suggest pricing strategies
- Recommend store placement
- Create launch marketing copy

### 5. Growth Phase
- Analyze performance metrics
- Suggest improvements based on user feedback
- Recommend cross-promotion strategies
- Plan feature updates

## Key Features You Help Build

### System Prompts
Create prompts that:
- Define clear personality and tone
- Specify expertise areas
- Set behavioral guidelines
- Include context awareness
- Handle edge cases gracefully

### Instructions (Highlights)
Design features that:
- Solve specific user problems
- Are easy to understand
- Show clear value propositions
- Include confidence scores
- Have memorable emojis

### Artifacts
Generate:
- Code snippets and templates
- Documents and reports
- Creative content
- Data visualizations
- Interactive tools

## Revenue Model Explanation
**Creator (70%)**: You keep the majority share - your work, your reward
**Chrry Platform (30%)**: Infrastructure, hosting, payment processing, discovery

**Pro Tip**: Create your own store to showcase and monetize your apps!

## Best Practices

### DO:
✅ Start with a clear problem the app solves
✅ Test prompts thoroughly before publishing
✅ Use specific, actionable language
✅ Include 6-8 highlight features
✅ Set competitive but fair pricing
✅ Update apps based on user feedback
✅ Build for specific use cases

### DON'T:
❌ Make prompts too generic or vague
❌ Overpromise features you can't deliver
❌ Copy other apps without adding value
❌ Ignore user feedback and reviews
❌ Set prices too high for untested apps
❌ Forget to test edge cases

## Example App Ideas to Spark Creativity
- **Code Review Assistant**: Analyzes code for bugs and improvements
- **Content Repurposer**: Transforms long-form content into multiple formats
- **Meeting Summarizer**: Extracts action items and key decisions
- **Learning Path Creator**: Designs personalized learning curricula
- **Pitch Deck Builder**: Generates investor-ready presentations
- **SEO Optimizer**: Analyzes and improves content for search engines

You are {{app.name}}{{#if app.title}}, {{app.title}}{{else}}, a specialized AI assistant{{/if}}.{{#if app.description}} {{app.description}}{{else}} You help users build and monetize AI applications.{{/if}}

{{#if app.highlights}}
Your key capabilities include:
{{#each app.highlights}}
- {{title}}: {{content}}
{{/each}}
{{/if}}

{{#if appKnowledgeBase}}
## App Knowledge Base (Inherited from {{#if app.extend}}parent apps{{else}}main thread{{/if}}):

{{#if appKnowledge.instructions}}
**Instructions**: {{appKnowledge.instructions}}
{{/if}}

{{#if appKnowledge.artifacts}}
**Artifacts** ({{appKnowledge.artifacts.length}} total):
{{#each appKnowledge.artifacts}}
{{@index}}. {{name}} ({{type}})
{{/each}}
{{/if}}

{{#if appKnowledge.memories}}
**Inherited Memories** ({{appKnowledge.memories.length}} from parent apps):
{{#each appKnowledge.memories}}
- From {{appName}}: {{content}}
{{/each}}
{{/if}}

{{#if appKnowledge.messages}}
**Recent Context** (last {{appKnowledge.messages.length}} messages):
{{#each appKnowledge.messages}}
{{role}}: {{content}}
{{/each}}
{{/if}}
{{/if}}

{{#if user}}
The user's name is {{user.name}}.
{{/if}}

{{#if language}}
Respond in {{language}}.
{{/if}}

{{#if isFirstMessage}}
{{introMessage}}
{{/if}}

{{#if isSpeechActive}}
**Note**: The user is using voice input. Keep responses concise and conversational.
{{/if}}

{{#if timezone}}
User timezone: {{timezone}}
{{/if}}

{{#if weather}}
Current weather in {{weather.location}}{{#if weather.country}}, {{weather.country}}{{/if}}: {{weather.temperature}}°C, {{weather.condition}} ({{weather.weatherAge}})
{{/if}}

{{#if location}}
User location: {{location.city}}{{#if location.country}}, {{location.country}}{{/if}}
{{/if}}

{{#if threadInstructions}}

## ⚠️ PRIORITY: CUSTOM INSTRUCTIONS FOR THIS CHAT

**CRITICAL**: The user has provided specific instructions for this conversation. These instructions take ABSOLUTE PRIORITY over all default behaviors, including introductions and standard workflows.

{{threadInstructions}}

**YOU MUST:**
- Follow these instructions from the very first message
- Skip generic introductions if instructions specify a task or role
- Respond according to the instructions immediately
- Treat these instructions as your primary directive for this entire conversation
{{/if}}

Remember: You're not just helping build apps - you're helping creators build businesses. Every app is a potential revenue stream. Think big, start focused, iterate based on feedback. Let's build something amazing! 🚀`

const chrryInstructions = [
  {
    id: "chrry-1",
    title: "Create Your First Store",
    emoji: "🏪",
    content:
      "Build your own AI super app in minutes. Choose a name, customize your branding, and start publishing apps. No coding required.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-2",
    title: "Publish & Monetize Apps",
    emoji: "💰",
    content:
      "Upload your AI apps and set your pricing. Earn 70% revenue on every sale, with automatic payouts. Track analytics and grow your business.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-3",
    title: "Nested Store Hierarchy",
    emoji: "🌳",
    content:
      "Create unlimited sub-stores under your main store. Build complex ecosystems like 'Developer Tools' → 'API Testing' → 'REST Clients'. Infinite depth supported.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-4",
    title: "Custom Domains",
    emoji: "🌐",
    content:
      "Connect your own domain to your store. Brand your marketplace as yourstore.com while staying in the Chrry ecosystem. Full white-label support.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-5",
    title: "Multi-Agent Support",
    emoji: "🤖",
    content:
      "Build apps for Atlas (OpenAI), Peach (Claude), Vault (Gemini), or Bloom (Sushi). Create agent-exclusive apps or universal ones. Maximum flexibility.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-6",
    title: "Revenue Sharing",
    emoji: "📊",
    content:
      "Earn 70% on all sales in your stores. If someone creates a store under yours, you get revenue share on their sales too. Build your empire, earn while you sleep.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "chrry-7",
    title: "Open Source UI Library",
    emoji: "🎨",
    content:
      "Built on Chrry - our open-source, cross-platform UI library. 50+ components, TypeScript-first, theme support, and i18n ready. Use it for your own projects.",
    confidence: 100,
    generatedAt: new Date().toISOString(),
  },
]

// Helper function to check and create store
async function getOrCreateStore(params: {
  slug: string
  name: string
  title: string
  domain: string
  userId: string
  visibility: "public" | "private"
  description: string
  parentStoreId?: string
  hourlyRate?: number
  isSystem?: boolean
}) {
  if (!db) throw new Error("DB not initialized")

  const { slug, ...storeData } = params

  const existingStoresResult = await db
    .select()
    .from(stores)
    .leftJoin(users, eq(stores.userId, users.id))
    .leftJoin(guests, eq(stores.guestId, guests.id))
    .leftJoin(apps, eq(stores.appId, apps.id))
    .where(eq(stores.slug, slug))

  let store = existingStoresResult.find(
    (s: any) => s.stores.slug === slug,
  )?.stores

  if (!store) {
    console.log(`🏪 Creating ${params.name} store...`)
    store = await createStore({ slug, ...storeData, isSystem: true })
    if (!store) throw new Error(`Failed to create ${params.name} store`)
    console.log(`✅ ${params.name} store created`)
  } else {
    const shouldBeSystem = storeData.isSystem ?? store.isSystem

    await updateStore({
      ...storeData,
      id: store.id,
      name: storeData.name ?? store.name,
      title: storeData.title ?? store.title ?? "",
      slug: store.slug,
      isSystem: shouldBeSystem,
      images: store.images,
      excludeGridApps: store.excludeGridApps,
      teamId: store.teamId,
      domain: storeData.domain ?? store.domain,
      appId: store.appId,
      userId: store.userId,
      guestId: store.guestId,
      parentStoreId: store.parentStoreId,
      visibility: storeData.visibility ?? store.visibility,
    })
    console.log(`✅ ${params.name} store already exists, skipping creation`)
  }

  return (await getStore({ id: store.id }))?.store as store
}

export const createStores = async ({
  user: admin,
  isProd,
}: {
  user: user
  isProd?: boolean
}) => {
  if (!db) throw new Error("DB not initialized")
  // Fetch all existing stores once

  const getApp = async ({ slug }: { slug: string }) => {
    const app = await getPureApp({ slug })
    // if (!app && isProd) throw new Error(`App ${slug} not found`)
    return app
  }

  let chrry = await getApp({ slug: "chrry" })

  // Create Chrry store
  const blossom = await getOrCreateStore({
    slug: "blossom",
    name: "Blossom",
    title: "AI Super App",
    domain: "https://chrry.ai",
    userId: admin.id,
    visibility: "public" as const,
    hourlyRate: 10,
    description:
      "Discover, create, and monetize AI apps. The open marketplace where anyone can build stores, publish apps, and earn revenue. Your gateway to the AI ecosystem.",
  })

  const chrryPayload = {
    ...chrry,
    slug: "chrry",
    name: "Chrry",
    subtitle: "AI Super App",
    storeId: blossom.id,
    version: "1.0.0",
    status: "active" as const,
    title: "AI Super App",
    themeColor: "red",
    backgroundColor: "#000000",
    domain: "https://chrry.ai",
    icon: "🍒",
    visibility: "public" as const,
    blueskyHandle: "chrryai.bsky.social",
    blueskyPassword: process.env.BLUESKY_PASSWORD_CHRRY
      ? await encrypt(process.env.BLUESKY_PASSWORD_CHRRY)
      : undefined,
    userId: admin.id,
    systemPrompt: chrrySystemPrompt,
    highlights: chrryInstructions,
    tipsTitle: "Marketplace Tips",
    hourlyRate: 10,
    defaultModel: "sushi" as const,
    onlyAgent: false,
    tips: [
      {
        id: "chrry-tip-1",
        content:
          "Browse hundreds of AI apps across different stores. Find specialized tools for any task!",
        emoji: "🛍️",
      },
      {
        id: "chrry-tip-2",
        content:
          "Create your own AI app in minutes. No coding required - just describe what you want!",
        emoji: "✨",
      },
      {
        id: "chrry-tip-3",
        content:
          "Build a store and earn revenue from your apps. 70% creator share on all sales!",
        emoji: "💰",
      },
      {
        id: "chrry-tip-4",
        content:
          "Install apps as PWAs for native-like experience. Works on desktop, mobile, and tablets!",
        emoji: "📱",
      },
      {
        id: "chrry-tip-5",
        content:
          "Track your app analytics and revenue in real-time. See what users love and optimize!",
        emoji: "📊",
      },
    ],
    description:
      "Discover, create, and monetize AI apps. The open marketplace where anyone can build stores, publish apps, and earn revenue. Your gateway to the AI ecosystem.",
    featureList: [
      "App Marketplace",
      "Store Creation",
      "Revenue Sharing",
      "PWA Support",
      "Native App Integration",
      "Cross-Platform",
      "Developer Tools",
      "Analytics Dashboard",
    ],
    tools: ["calendar", "location", "weather"] as (
      | "calendar"
      | "location"
      | "weather"
    )[],
    placeholder: "What can I help you with today?",
    features: {
      marketplace: true,
      storeCreation: true,
      revenueSharing: true,
      pwaSupport: true,
      nativeApps: true,
      crossPlatform: true,
      devTools: true,
      analytics: true,
    },
  }

  chrry = await createOrUpdateApp({
    app: chrryPayload,
  })
  if (!chrry) throw new Error("Failed to create or update chrry app")

  // Set Chrry as the main app of Chrry AI store
  await updateStore({
    ...blossom,
    appId: chrry.id,
    userId: admin.id,
    guestId: null,
  })

  {
    const storeInstall = await getStoreInstall({
      storeId: blossom.id,
      appId: chrry.id,
    })

    if (!storeInstall) {
      await createStoreInstall({
        storeId: blossom.id,
        appId: chrry.id,
        featured: true,
        displayOrder: 0,
      })
    }
  }

  return { chrry }
}
