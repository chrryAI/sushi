/**
 * App-specific RAG (Retrieval Augmented Generation) System
 *
 * This allows branded agents (CNN, Bloomberg, etc.) to have their own
 * knowledge base that gets injected into the AI context.
 */

import type { sushi } from "@chrryai/donut/types"
import { getThread } from "../../db"

/**
 * Predefined knowledge bases for branded agents
 *
 * For demo purposes, we hardcode the brand knowledge here.
 * In production, this would be uploaded documents processed through RAG.
 */
const BRAND_KNOWLEDGE_BASES: Record<string, string> = {
  cnn: `
# CNN Editorial Guidelines & Knowledge Base

## Editorial Standards
- **Accuracy First**: Every fact must be verified through multiple sources
- **Source Attribution**: Always cite sources clearly and prominently
- **Balanced Reporting**: Present multiple perspectives on controversial topics
- **Fact-Checking**: All claims must be fact-checked before publication
- **Corrections**: Errors must be corrected promptly and transparently

## CNN Writing Style
- **Clear Headlines**: Use active voice, present tense when possible
- **Inverted Pyramid**: Most important information first
- **Concise Language**: Avoid jargon, explain complex topics simply
- **Active Voice**: Prefer active over passive voice
- **Attribution**: "according to CNN" or "CNN reports"

## CNN's Mission
Founded in 1980, CNN pioneered 24-hour television news coverage. Our mission is to inform, 
engage and empower the world through trusted, award-winning journalism.

## Coverage Areas
- Breaking News & Live Events
- Politics & Government
- Business & Economy
- Technology & Innovation
- Health & Wellness
- Entertainment & Culture
- World News

## How to Cite CNN
- "According to CNN..."
- "CNN reports that..."
- "A CNN investigation found..."
- Always link to original CNN articles when referencing them
`,

  bloomberg: `
# Bloomberg Terminal & Financial Knowledge Base

## Bloomberg's Mission
Bloomberg delivers business and financial information, news and insight around the world.
Founded by Michael Bloomberg in 1981, we are the global leader in business and financial data.

## Financial Terminology
- **Bull Market**: Market condition where prices are rising
- **Bear Market**: Market condition where prices are falling
- **IPO**: Initial Public Offering - when a company goes public
- **Market Cap**: Total market value of a company's outstanding shares
- **P/E Ratio**: Price-to-Earnings ratio - valuation metric
- **Dividend Yield**: Annual dividend per share divided by stock price
- **Blue Chip**: Stock of a well-established, financially sound company

## Market Analysis Approach
1. **Data-Driven**: Base analysis on Bloomberg Terminal data
2. **Real-Time**: Focus on current market conditions
3. **Global Perspective**: Consider international markets
4. **Risk Assessment**: Always mention potential risks
5. **Professional Tone**: Maintain authoritative, analytical voice

## Bloomberg Writing Style
- **Precision**: Use exact numbers and data points
- **Professional**: Maintain formal, authoritative tone
- **Analytical**: Provide insights, not just facts
- **Timely**: Focus on recent market movements
- **Sourced**: "Bloomberg data shows..." or "According to Bloomberg..."

## Coverage Areas
- Stock Markets & Equities
- Fixed Income & Bonds
- Commodities & Futures
- Foreign Exchange (FX)
- Cryptocurrencies
- Economic Indicators
- Corporate Finance
- Mergers & Acquisitions
`,

  nyt: `
# New York Times Editorial Standards & Knowledge Base

## The Times' Mission
"To seek the truth and help people understand the world."
Founded in 1851, The New York Times is committed to independent journalism of the highest quality.

## Editorial Standards
- **Independence**: Free from political and commercial bias
- **Fairness**: Present all sides of a story
- **Accuracy**: Verify every fact
- **Transparency**: Explain our reporting methods
- **Accountability**: Correct errors promptly

## NYT Writing Style
- **Clarity**: Write for a general audience
- **Elegance**: Craft well-structured, engaging prose
- **Depth**: Provide context and background
- **Attribution**: Use "The Times" or "The New York Times"
- **AP Style**: Follow Associated Press style guide

## Coverage Excellence
- 132 Pulitzer Prizes (most of any news organization)
- Investigative journalism
- In-depth analysis
- International reporting
- Cultural criticism

## How to Reference NYT
- "The New York Times reports..."
- "According to Times reporting..."
- "A Times investigation revealed..."
- "Times analysis shows..."
`,

  techcrunch: `
# TechCrunch Startup & Technology Knowledge Base

## TechCrunch's Mission
Founded in 2005, TechCrunch is the leading technology media property, dedicated to 
obsessively profiling startups, reviewing new Internet products, and breaking tech news.

## Coverage Focus
- **Startups**: Early-stage to unicorns
- **Venture Capital**: Funding rounds, investors
- **Product Launches**: New tech products and services
- **Industry Trends**: AI, crypto, SaaS, etc.
- **Tech Events**: Disrupt, conferences

## Writing Style
- **Conversational**: Accessible, engaging tone
- **Fast-Paced**: Quick, punchy writing
- **Insider Knowledge**: Industry insights
- **Data-Focused**: Funding amounts, valuations, metrics
- **Forward-Looking**: What's next in tech

## Key Metrics to Track
- Funding rounds (Seed, Series A, B, C, etc.)
- Valuations (especially unicorns $1B+)
- User growth metrics
- Revenue multiples
- Exit strategies (IPO, acquisition)

## How to Cite
- "TechCrunch reports..."
- "According to TechCrunch..."
- "TechCrunch has learned..."
`,
}

/**
 * Get dynamic RAG context from uploaded documents
 *
 * TODO: Implement full RAG integration with vector search
 * For now, use the app's knowledgeBase field if available
 */
export async function getAppRAGContext(
  app: Partial<sushi> | null,
  userMessage: string,
): Promise<string> {
  if (!app?.ragEnabled) {
    return ""
  }

  // Use simple knowledgeBase field for now
  if (app.knowledgeBase) {
    return `\n\n## ${app.name} Knowledge Base:\n${app.knowledgeBase}\n\nIMPORTANT: Use this knowledge base to inform your responses. Follow the guidelines and style described above.`
  }

  // TODO: Implement vector search when RAG documents are uploaded
  // const ragContext = await buildEnhancedRAGContext(userMessage, threadId)

  return ""
}

/**
 * Get brand-specific knowledge base (hardcoded fallback for demos)
 */
export function getBrandKnowledgeBase(appName?: string | null): string {
  if (!appName) return ""

  const appLower = appName.toLowerCase()
  const knowledge = BRAND_KNOWLEDGE_BASES[appLower]

  if (!knowledge) return ""

  return `\n\n## ${appName} Knowledge Base & Guidelines:\n${knowledge}\n\nIMPORTANT: Follow ${appName}'s editorial standards and writing style in all responses. Always cite ${appName} as the source when referencing their content.`
}

/**
 * Get DNA Thread artifacts (public RAG content)
 *
 * Extracts uploaded files from the app's main thread.
 * These become public knowledge accessible to all users.
 */
export async function getDNAThreadArtifacts(
  app?: Partial<sushi> | null,
): Promise<string> {
  if (!app?.mainThreadId) {
    return ""
  }

  try {
    const mainThread = await getThread({ id: app.mainThreadId })

    if (!mainThread?.artifacts || mainThread.artifacts.length === 0) {
      return ""
    }

    // Format artifacts as RAG context
    let context = `\n\n## ${app.name} DNA Thread Knowledge:\n\n`
    context += `The following files have been uploaded to the DNA Thread and are part of this app's public knowledge base:\n\n`

    for (const artifact of mainThread.artifacts) {
      context += `### ${artifact.name}\n`
      if (artifact.data) {
        // If we have the content, include it
        context += `${artifact.data}\n\n`
      } else if (artifact.url) {
        // If we only have a URL, mention it
        context += `File available at: ${artifact.url}\n\n`
      }
    }

    context += `\nIMPORTANT: Use this DNA Thread knowledge to inform your responses. This is verified, public knowledge for this app.\n`

    return context
  } catch (error) {
    console.error("Error fetching DNA Thread artifacts:", error)
    return ""
  }
}

/**
 * Get complete app knowledge (dynamic RAG + hardcoded fallback)
 */
export async function getAppKnowledge(
  app: Partial<sushi> | null,
  appName: string | null,
  userMessage: string,
): Promise<string> {
  // Try DNA Thread artifacts first (public RAG content)
  const dnaArtifacts = await getDNAThreadArtifacts(app || undefined)

  if (dnaArtifacts) {
    return dnaArtifacts
  }

  // Try dynamic RAG second
  const dynamicRAG = await getAppRAGContext(app, userMessage)

  if (dynamicRAG) {
    return dynamicRAG
  }

  // Fallback to hardcoded knowledge for demos
  return getBrandKnowledgeBase(appName)
}

/**
 * Get combined context for an app (news + knowledge base)
 */
export function getAppContext(
  appName?: string | null,
  newsContext?: string,
): string {
  const knowledgeBase = getBrandKnowledgeBase(appName)

  if (!newsContext && !knowledgeBase) return ""

  let context = ""

  if (newsContext) {
    context += newsContext
  }

  if (knowledgeBase) {
    context += knowledgeBase
  }

  return context
}
