export const getFeatures = ({
  t,
  //500
  ADDITIONAL_CREDITS,
  //5.0EU
  CREDITS_PRICE,
}: {
  t: (key: string, options?: any) => string
  ADDITIONAL_CREDITS: number
  CREDITS_PRICE: number
}) => {
  const plusFeatures = [
    {
      emoji: "🤖",
      text: `${t("AI credits per month", { credits: `${2000}`, freeCredits: 150 })}`,
    },
    {
      emoji: "⚡",
      text: t("Messages per hour", { messages: 100, freeMessages: 30 }),
    },

    {
      emoji: "✨",
      text: t("Character profiles per day", { profiles: 50 }),
    },
    {
      emoji: "👩‍💻",
      text: t("Create apps in your store with unlimited collaboration"),
    },
    {
      emoji: "🖼️",
      text: t("Image processing & analysis"),
    },
    {
      emoji: "🌟",
      text: t("Priority support & assistance"),
    },
    {
      emoji: "🎤",
      text: t("Unlimited voice conversations"),
    },
    {
      emoji: "🦛",
      text: t("50GB Hippo Storage"),
    },
    {
      emoji: "🌱",
      text: t("0.5% of subscription goes to CO₂ removal"),
    },
  ]

  const memberFeatures = [
    {
      emoji: "🧠",
      text: t("Access to AI models"),
    },
    {
      emoji: "🤖",
      text: `${t("AI credits per month compare to guest", {
        credits: `${150}`,
        freeCredits: 30,
      })}`,
    },

    {
      emoji: "⚡",
      text: t("Messages per hour compare to guest", {
        messages: 30,
        freeMessages: 10,
      }),
    },
    {
      emoji: "📁",
      text: t("File upload & analysis support"),
    },
    {
      emoji: "✨",
      text: t("Character profiles per day", { profiles: 25 }),
    },
    {
      emoji: "👩‍💻",
      text: t("Create apps in your store with unlimited collaboration"),
    },
    {
      emoji: "🌐",
      text: t("Web, PWA & extension access"),
    },
    {
      emoji: "🎨",
      text: t("Custom themes & personalization"),
    },
    {
      emoji: "🦛",
      text: t("10GB Hippo Storage"),
    },
    {
      emoji: "🔄",
      text: t("Cross-device sync & history"),
    },
  ]

  const proFeatures = [
    {
      emoji: "🚀",
      text: `${t("AI credits per month", { credits: `${5000}`, freeCredits: 150 })}`,
    },
    {
      emoji: "⚡",
      text: t("Messages per hour", { messages: 200, freeMessages: 30 }),
    },
    {
      emoji: "🔑",
      text: t("Can bring your own API keys"),
    },
    {
      emoji: "👩‍💻",
      text: t("Create custom AI apps with team collaboration"),
    },
    {
      emoji: "🍒",
      text: t("Unlimited apps in your store"),
    },
    {
      emoji: "✨",
      text: t("Character profiles per day", { profiles: 75 }),
    },
    {
      emoji: "🔄",
      text: t("Higher generation limits (25 titles/instructions per hour)"),
    },
    {
      emoji: "🦛",
      text: t("250GB Hippo Storage"),
    },
    {
      emoji: "🌱",
      text: t("0.5% of subscription goes to CO₂ removal"),
    },
  ]

  const grapeFreeFeatures = [
    {
      emoji: "🍒",
      text: t("Create your own brand"),
    },
    {
      emoji: "🧠",
      text: t("Build app knowledge"),
    },
    {
      emoji: "🧬",
      text: t("DNA Thread & RAG"),
    },
    {
      emoji: "📱",
      text: t("1 app in your store"),
    },
    {
      emoji: "🔗",
      text: t("Extend from any existing store apps"),
    },
    {
      emoji: "📊",
      text: t("View public analytics"),
    },
    {
      emoji: "🌐",
      text: t("AI analytics chat"),
    },
    {
      emoji: "🆓",
      text: t("Free analytics tracking"),
    },
    {
      emoji: "🦛",
      text: t("1GB Free Hippo Storage"),
    },
  ]

  const grapePlusFeatures = [
    {
      emoji: "🍇",
      text: t("Everything in free"),
    },
    {
      emoji: "🍓",
      text: t("Strawberry included (€9.99/month)"),
    },
    {
      emoji: "🚀",
      text: t("Unlimited apps in your store"),
    },
    {
      emoji: "🔗",
      text: t("Extend from any existing store apps"),
    },
    {
      emoji: "📊",
      text: t("View public analytics"),
    },
    {
      emoji: "📈",
      text: t("Advanced analytics dashboard"),
    },
    {
      emoji: "🔌",
      text: t("Send analytics from your API"),
    },
    {
      emoji: "🌐",
      text: t("Public analytics sharing"),
    },
    {
      emoji: "📉",
      text: t("Real-time event tracking"),
    },
    {
      emoji: "🦛",
      text: t("10GB Hippo Storage"),
    },
  ]

  const grapeProFeatures = [
    {
      emoji: "🌀",
      text: t("Create your universe, 🍒 multiple brands"),
    },
    {
      emoji: "🫐",
      text: t("Raspberry included (€19.99/month)"),
    },
    {
      emoji: "🔗",
      text: t("Extend from any existing store apps"),
    },
    {
      emoji: "📊",
      text: t("Full analytics access"),
    },
    {
      emoji: "🔒",
      text: t("Private analytics option"),
    },
    {
      emoji: "🔌",
      text: t("Send analytics from your API"),
    },
    {
      emoji: "📈",
      text: t("Plausible/Sovereign integration"),
    },
    {
      emoji: "🎯",
      text: t("Custom event tracking"),
    },
    {
      emoji: "📉",
      text: t("Advanced analytics queries"),
    },
    {
      emoji: "💾",
      text: t("Data export capabilities"),
    },
    {
      emoji: "🦛",
      text: t("50GB Hippo Storage"),
    },
  ]

  const pearFreeFeatures = [
    {
      emoji: "🍒",
      text: t("Create your own brand"),
    },
    {
      emoji: "🧠",
      text: t("Build app knowledge"),
    },
    {
      emoji: "🧬",
      text: t("DNA Thread & RAG"),
    },
    {
      emoji: "💬",
      text: t("Get feedbacks on your apps"),
    },
    {
      emoji: "💰",
      text: t("Auto credit deduction"),
    },
    {
      emoji: "🌐",
      text: t("Public feedback only"),
    },
    {
      emoji: "🎯",
      text: t("AI-validated feedback"),
    },
    {
      emoji: "🦛",
      text: t("1GB Free Hippo Storage"),
    },
  ]

  const pearPlusFeatures = [
    {
      emoji: "🍐",
      text: t("Everything in free"),
    },
    {
      emoji: "🍓",
      text: t("Strawberry included (€9.99/month)"),
    },
    {
      emoji: "💎",
      text: t("€50 feedback credits/month"),
    },
    {
      emoji: "💬",
      text: t("Give unlimited feedback"),
    },
    {
      emoji: "🌐",
      text: t("Public feedback only"),
    },
    {
      emoji: "🎯",
      text: t("AI-validated feedback"),
    },
    {
      emoji: "📊",
      text: t("Feedback analytics"),
    },
    {
      emoji: "🦛",
      text: t("10GB Hippo Storage"),
    },
  ]

  const pearProFeatures = [
    {
      emoji: "🍐",
      text: t("Everything in plus"),
    },
    {
      emoji: "🫐",
      text: t("Raspberry included (€19.99/month)"),
    },
    {
      emoji: "🌀",
      text: t("Create your universe, 🍒 multiple brands"),
    },
    {
      emoji: "💎",
      text: t("€500 feedback credits/month"),
    },
    {
      emoji: "💬",
      text: t("Give unlimited feedback"),
    },
    {
      emoji: "🔒",
      text: t("Private feedback option"),
    },
    {
      emoji: "🎯",
      text: t("AI-validated feedback"),
    },
    {
      emoji: "📊",
      text: t("Advanced feedback analytics"),
    },
    {
      emoji: "⭐",
      text: t("Higher credit rewards"),
    },
    {
      emoji: "🦛",
      text: t("50GB Hippo Storage"),
    },
  ]

  const sushiFreeFeatures = [
    {
      emoji: "🍣",
      text: t("Sushi GitHub Agent: The First Strike"),
    },
    {
      emoji: "🏗️",
      text: t("Automated .sushi Dojo Discovery & App Memory"),
    },
    {
      emoji: "🕸️",
      text: t("Dead Code Hunt (The Ghost in the Machine)"),
    },
    {
      emoji: "🥋",
      text: t("E2E Testing Foundation (Single Dojo Branch)"),
    },
    {
      emoji: "⚖️",
      text: t("Basic Metrics (Moral Usage)"),
    },
    {
      emoji: "🍒",
      text: t("Create your own brand"),
    },
    {
      emoji: "🧠",
      text: t("Build app knowledge"),
    },
    {
      emoji: "🧬",
      text: t("DNA Thread & RAG"),
    },
    {
      emoji: "🎯",
      text: t("Create, Grow, Sell, Earn 70%"),
    },
    {
      emoji: "🦛",
      text: t("1GB Free Hippo Storage"),
    },
  ]

  const sushiCoderFeatures = [
    {
      emoji: "🍓",
      text: t("Strawberry included (€9.99/month)"),
    },
    {
      emoji: "🦅",
      text: t("Advanced Logic Reasoning"),
    },
    {
      emoji: "🍣",
      text: t("Bam 💥 Strike 🏹 Injection"),
    },
    {
      emoji: "🎲",
      text: t("Scenario Simulation (The Combatant's Trial)"),
    },
    {
      emoji: "👊",
      text: t("Post-Merge 🧼 Tyler Insights: 'You are not your code'"),
    },
    {
      emoji: "♾️",
      text: t("Unlimited E2E Runs (No Handbrake/Sınırsız Mermi)"),
    },
    {
      emoji: "🧠",
      text: t("Deep Context Awareness & PR Memory"),
    },

    {
      emoji: "⚡",
      text: t("Priority Queue Access (141ms Latency Goal)"),
    },
    {
      emoji: "🎯",
      text: t("Create, Grow, Sell, Earn 70%"),
    },
    {
      emoji: "🦛",
      text: t("10GB Hippo Storage"),
    },
  ]

  const sushiArchitectFeatures = [
    {
      emoji: "🫐",
      text: t("Raspberry included (€19.99/month)"),
    },
    {
      emoji: "🦁",
      text: t("Strategic Architect Insights"),
    },
    {
      emoji: "🏛️",
      text: t("Architecture & Complexity XP Audit"),
    },
    {
      emoji: "🗝️",
      text: t("Full System Sovereignty Audit (Sato Mode)"),
    },
    {
      emoji: "🎭",
      text: t("Customizable 👊 Tyler & 🦋 Zarathustra Personas"),
    },
    {
      emoji: "🛡️",
      text: t("Logic Toggle (Opt-out for Philosophy)"),
    },
    {
      emoji: "📉",
      text: t("Technical Debt Analytics & Autonomous Refactor"),
    },
    {
      emoji: "🌀",
      text: t("Create your apps, 🍋 multiple Coders"),
    },
    {
      emoji: "🎯",
      text: t("Create, Grow, Sell, Earn 70%"),
    },
    {
      emoji: "🦛",
      text: t("50GB Hippo Storage"),
    },
  ]

  const watermelonFeatures = [
    {
      emoji: "🍒",
      text: t("Create your own brand"),
    },
    {
      emoji: "🏷️",
      text: t("White Label & Custom Branding"),
    },
    {
      emoji: "🫐",
      text: t("Raspberry included (25 team seats, €19.99/seat after)"),
    },
    {
      emoji: "👩‍💻",
      text: t("Create custom AI apps with team collaboration"),
    },

    {
      emoji: "🌐",
      text: t("Custom Domain Integration"),
    },
    {
      emoji: "📊",
      text: t("Full Plausible Analytics Integration"),
    },
    {
      emoji: "🏢",
      text: t("Agency-Level Deployment"),
    },
    {
      emoji: "🦛",
      text: t("1TB distributed Hippo Storage"),
    },
    {
      emoji: "✅",
      text: t("All Standard Features Included"),
    },
  ]

  const watermelonPlusFeatures = [
    {
      emoji: "🌀",
      text: t("Create your universe, 🍒 multiple brands"),
    },

    {
      emoji: "👩‍💻",
      text: t("Create custom AI apps with team collaboration"),
    },
    {
      emoji: "👥",
      text: t("Unlimited team seats (you manage)"),
    },
    {
      emoji: "🏯",
      text: t("Private Dojo: Pure Sovereignty"),
    },
    {
      emoji: "🧠",
      text: t("Isolated (Private DB & Instance)"),
    },
    {
      emoji: "📱",
      text: t("Web, Desktop & Mobile, Extension build pipelines"),
    },

    {
      emoji: "🔐",
      text: t("RSA Key Signing & Encryption"),
    },
    {
      emoji: "🦛",
      text: t("Unlimited Sovereign Hippo Storage"),
    },
    {
      emoji: "⚔️",
      text: t("Enhanced Data Privacy Protection"),
    },
  ]

  const creditsFeatures = [
    {
      emoji: "💰",
      text: `${t("credits_pricing", {
        credits: `${ADDITIONAL_CREDITS}`,
        price: `${CREDITS_PRICE}.00`,
      })}`,
    },
    {
      emoji: "🔥",
      text: t(
        "Credits only required for Anonymous Apps like Burn as spam filter",
      ),
    },
    {
      emoji: "♻️",
      text: t("Credits are never wasted — they power your app"),
    },

    {
      emoji: "✨",
      text: t("No commitment required"),
    },
    {
      emoji: "👩‍💻",
      text: t("Create apps in your store with unlimited collaboration"),
    },

    {
      emoji: "🥰",
      text: t("Pay as you go"),
    },
    {
      emoji: "👩‍💻",
      text: t("Signed-in users create apps for free"),
    },

    {
      emoji: "🌱",
      text: t("0.5% of purchase goes to CO₂ removal"),
    },
  ].filter((x) => x !== null)

  return {
    plusFeatures,
    memberFeatures,
    creditsFeatures,
    proFeatures,
    grapeFreeFeatures,
    grapePlusFeatures,
    grapeProFeatures,
    watermelonFeatures,
    watermelonPlusFeatures,
    pearFreeFeatures,
    pearPlusFeatures,
    pearProFeatures,
    sushiFreeFeatures,
    sushiCoderFeatures,
    sushiArchitectFeatures,
  }
}
