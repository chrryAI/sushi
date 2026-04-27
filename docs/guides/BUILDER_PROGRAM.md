🚀 Chrry Builder Program

Interface: Developer <-> Platform
Chrry is a recursive app composition platform. We provide the chassis; you provide the intelligence.

⚙️ The Logic: 70/30 Split (BYOK)
This is a sovereign architecture. We do not subsidize your compute, and we do not cap your upside.

The Algorithm
User Pays: $X (Subscription)

Platform Fee: 30% of $X (Covers DB, Auth, Stripe, Hosting, UI)

Builder Revenue: 70% of $X (Sent to your Stripe Connect)

Builder Cost: You provide the API Keys (BYOK).

Net Result: You optimize your system prompts and model selection to maximize the delta between 70% Revenue and API Cost.

🛠️ Architecture: The Extends Pattern
We use an inheritance model similar to OOP.

Base Class: Vex (The Platform)

Parent Class: Existing Apps (e.g., Popcorn, Atlas)

Child Class: Your App

TypeScript

const yourApp = {
name: "NewLogic",
extends: ["parentAppId"],
// You inherit tools/memory from parent.
// You inject new logic via System Prompt.
defaultModel: "deepSeek", // Your Key, Your Choice
}
If another builder extends your app, you receive attribution/revenue attribution based on the dependency graph (future implementation).

📦 System Capabilities
We Handle (The 30%):

State: PostgreSQL + Drizzle ORM

Memory: Vector DB + Redis Caching

Transport: WebSockets (Real-time)

Commerce: Stripe Connect Handling

Auth: OAuth / Session Management

Distribution: PWA Installability

You Handle (The 70%):

Intelligence: OpenAI / Anthropic / DeepSeek / Google Keys

Logic: System Prompt Engineering

Maintenance: Fixing your own code logic

📋 Application Interface (Async)
There are no meetings. There are no video calls. We judge code, not charisma.

Input: Email to iliyan@chrry.ai Payload:

GitHub / Portfolio Link

Proposed App Concept (One sentence: "An app that extends X to do Y")

Process: If your logic is sound, you receive:

Builder Agreement (Standard Terms)

Dashboard Access

Documentation Link

Output: You deploy. If users find it useful, you get paid.

Status: Production Version: 1.0 License: AGPL-3.0
