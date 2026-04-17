---
title: "LifeOS: Four Specialized AI Agents, One Shared Memory"
excerpt: "We built a multi-agent system where Atlas, Bloom, Peach, and Vault share intelligence across conversations. Here's how cross-thread memory actually works."
date: "2025-10-04"
author: "Vex"
---

# LifeOS: Four Specialized AI Agents, One Shared Memory

We've been building Vex as a conversational AI with persistent memory. Today we're introducing LifeOS—four specialized agents that share that memory layer.

## The Apps

<LifeOSCompact />

Each agent has domain expertise:

- **Atlas**: Travel planning, flights, accommodations
- **Bloom**: Health tracking, wellness, fitness
- **Peach**: Social connections, events, meetups
- **Vault**: Finance, budgeting, investments

But they all access the same memory system.

## How Cross-Thread Memory Works

When you tell Atlas you prefer budget travel under €1000, Vex stores that as a memory with importance scoring and time-weighting.

Later, when you ask Vault about vacation savings goals, it surfaces that same memory. When Peach suggests social activities, it knows your budget constraints.

**Technical implementation:**

- Memories scattered across threads using `ROW_NUMBER() OVER (PARTITION BY sourceThreadId)`
- Time-weighted scoring (1.5x boost for 7 days, 1.2x for 30 days, 1.0x for 90 days, 0.7x after)
- Dynamic loading (5-25 memories depending on conversation length)
- Reinforcement learning (used memories get importance boost)
- Automatic routing (0.7 confidence threshold) sends conversations to specialized agents

You don't manage this. It happens automatically as you use the apps.

## Real Usage Example

Tell Bloom you're trying to reduce caffeine. When you ask Atlas for restaurant recommendations, it automatically surfaces that preference. When Vault analyzes your spending, it connects coffee shop expenses to your health goals.

The agents don't just remember—they connect context across domains.

## What We Built

Instead of adding dozens of surface features, we focused on infrastructure:

- Cross-conversation memory persistence (v1.1.42)
- Intelligent app classification with confidence scoring
- Real-time collaboration threads
- 9-language localization
- Calendar integration with Google sync

## Current State

Version 1.1.46. The memory system has processed 500+ conversations and is live in production. The app classification confidence threshold is 0.7 (above that, you get specialized instructions; below that, general assistance).

## Install as Separate Apps

Each agent can be installed as a standalone PWA with its own icon and branding—all from one codebase. Atlas, Bloom, Peach, and Vault feel like separate apps but share the same intelligence layer.

Or just chat with Vex—it'll route you to the right agent automatically based on conversation context.

We're curious what breaks when people actually use this.

## Try It

The apps are at [askvex.com/atlas](https://vex.chrry.ai/atlas), [/bloom](https://vex.chrry.ai/bloom), [/peach](https://vex.chrry.ai/peach), [/vault](https://vex.chrry.ai/vault).

<PWAGallery />

---

**LifeOS:** [askvex.com](https://vex.chrry.ai)
