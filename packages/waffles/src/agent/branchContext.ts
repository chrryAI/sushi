/**
 * Branch-Based AI Agent Context System
 *
 * Every git branch becomes an isolated agent workspace.
 * Branch switch = agent context switch (spatial Z-axis navigation).
 */

import { execSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { Effect } from "effect"

export interface BranchAgentWorkspace {
  id: string
  namespace: string
  branchName: string
  fullBranchName: string
  agentId: string
  systemPrompt?: string
  instructions: any[]
  memories: any[]
  characterProfile?: any
  evolutionScore: number
  lastCommitSha?: string
  metadata: Record<string, any>
  createdOn: string
  updatedOn: string
}

export interface BranchContext {
  currentBranch: string
  namespace: string
  branchName: string
  workspace?: BranchAgentWorkspace
  previousBranch?: string
}

const BRANCH_STORAGE_KEY = "chrry-branch-agents"

function getStorage(): Record<string, BranchAgentWorkspace> {
  if (typeof globalThis === "undefined") return {}
  try {
    const raw = (globalThis as any)[BRANCH_STORAGE_KEY]
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function setStorage(data: Record<string, BranchAgentWorkspace>) {
  if (typeof globalThis !== "undefined") {
    ;(globalThis as any)[BRANCH_STORAGE_KEY] = JSON.stringify(data)
  }
}

function fileStoragePath(): string | undefined {
  try {
    const cwd = process.cwd()
    return `${cwd}/.chrry/branch-agents.json`
  } catch {
    return undefined
  }
}

function loadFileStorage(): Record<string, BranchAgentWorkspace> {
  const path = fileStoragePath()
  if (!path) return {}
  try {
    const fs = require("node:fs")
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, "utf-8"))
    }
  } catch {}
  return {}
}

function saveFileStorage(data: Record<string, BranchAgentWorkspace>) {
  const path = fileStoragePath()
  if (!path) return
  try {
    const fs = require("node:fs")
    const dir = path.replace("/branch-agents.json", "")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
  } catch {}
}

function getAllWorkspaces(): Record<string, BranchAgentWorkspace> {
  const mem = getStorage()
  const file = loadFileStorage()
  return { ...file, ...mem }
}

function setAllWorkspaces(data: Record<string, BranchAgentWorkspace>) {
  setStorage(data)
  saveFileStorage(data)
}

export function getCurrentBranch(): string | undefined {
  // 1. Environment override (CI, hooks)
  const envBranch =
    process.env.CHRRY_BRANCH ||
    process.env.GIT_BRANCH ||
    process.env.GITHUB_HEAD_REF ||
    process.env.CF_PAGES_BRANCH
  if (envBranch) return envBranch

  // 2. Git command
  try {
    const branch = execSync("git branch --show-current", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim()
    if (branch) return branch
  } catch {}

  // 3. Fallback for detached HEAD
  try {
    const desc = execSync("git describe --all --contains HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim()
    if (desc) return desc.replace(/^heads\//, "")
  } catch {}

  return undefined
}

export function parseBranchName(fullBranch: string): {
  namespace: string
  branchName: string
} {
  const parts = fullBranch.split("/")
  if (parts.length >= 2) {
    return {
      namespace: parts.slice(0, -1).join("/"),
      branchName: parts[parts.length - 1]!,
    }
  }
  return {
    namespace: "default",
    branchName: fullBranch,
  }
}

export function generateAgentId(namespace: string, branchName: string): string {
  return `agent-${namespace}-${branchName}-${randomUUID().slice(0, 8)}`
}

export function createBranchWorkspace(
  fullBranchName: string,
  overrides?: Partial<BranchAgentWorkspace>,
): BranchAgentWorkspace {
  const { namespace, branchName } = parseBranchName(fullBranchName)
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    namespace,
    branchName,
    fullBranchName,
    agentId: overrides?.agentId || generateAgentId(namespace, branchName),
    systemPrompt:
      overrides?.systemPrompt || defaultSystemPrompt(namespace, branchName),
    instructions: overrides?.instructions || [],
    memories: overrides?.memories || [],
    characterProfile: overrides?.characterProfile,
    evolutionScore: overrides?.evolutionScore ?? 0,
    lastCommitSha: overrides?.lastCommitSha,
    metadata: overrides?.metadata || {
      createdBy: "branch-agent-system",
      version: "1.0",
    },
    createdOn: overrides?.createdOn || now,
    updatedOn: now,
  }
}

function defaultSystemPrompt(namespace: string, branchName: string): string {
  return `You are the AI agent for the branch "${namespace}/${branchName}".
Your knowledge, memories, and behavior are isolated to this branch.
When switching branches, save your current context and load the new one.
Collaborate with other branch agents via @namespace/branch mentions.`
}

export function loadBranchWorkspace(
  fullBranchName: string,
): BranchAgentWorkspace | undefined {
  const workspaces = getAllWorkspaces()
  return workspaces[fullBranchName]
}

export function saveBranchWorkspace(
  workspace: BranchAgentWorkspace,
): BranchAgentWorkspace {
  const workspaces = getAllWorkspaces()
  workspace.updatedOn = new Date().toISOString()
  workspaces[workspace.fullBranchName] = workspace
  setAllWorkspaces(workspaces)
  return workspace
}

export function getOrCreateBranchWorkspace(
  fullBranchName: string,
): BranchAgentWorkspace {
  const existing = loadBranchWorkspace(fullBranchName)
  if (existing) return existing
  const created = createBranchWorkspace(fullBranchName)
  return saveBranchWorkspace(created)
}

export function switchBranchContext(
  newBranch: string,
  previousBranch?: string,
): BranchContext {
  const { namespace, branchName } = parseBranchName(newBranch)

  // Save previous if exists
  if (previousBranch) {
    const prevWorkspace = loadBranchWorkspace(previousBranch)
    if (prevWorkspace) {
      saveBranchWorkspace(prevWorkspace)
    }
  }

  // Load or create new workspace
  const workspace = getOrCreateBranchWorkspace(newBranch)

  return {
    currentBranch: newBranch,
    namespace,
    branchName,
    workspace,
    previousBranch,
  }
}

export function autoDetectAndSwitch(
  previousBranch?: string,
): BranchContext | undefined {
  const current = getCurrentBranch()
  if (!current) return undefined
  if (current === previousBranch) {
    return {
      currentBranch: current,
      ...parseBranchName(current),
      workspace: loadBranchWorkspace(current),
      previousBranch,
    }
  }
  return switchBranchContext(current, previousBranch)
}

export function listBranchWorkspaces(): BranchAgentWorkspace[] {
  return Object.values(getAllWorkspaces())
}

export function deleteBranchWorkspace(fullBranchName: string): boolean {
  const workspaces = getAllWorkspaces()
  if (!workspaces[fullBranchName]) return false
  delete workspaces[fullBranchName]
  setAllWorkspaces(workspaces)
  return true
}

export function updateBranchMetadata(
  fullBranchName: string,
  metadata: Record<string, any>,
): BranchAgentWorkspace | undefined {
  const workspace = loadBranchWorkspace(fullBranchName)
  if (!workspace) return undefined
  workspace.metadata = { ...workspace.metadata, ...metadata }
  return saveBranchWorkspace(workspace)
}

export function recordMutation(
  fullBranchName: string,
  mutation: { type: string; description: string; success?: boolean },
): BranchAgentWorkspace | undefined {
  const workspace = loadBranchWorkspace(fullBranchName)
  if (!workspace) return undefined

  const mutations = (workspace.metadata.mutations || []) as any[]
  mutations.push({
    ...mutation,
    timestamp: new Date().toISOString(),
  })

  // Update evolution score with simple EWMA
  const successCount = mutations.filter((m) => m.success).length
  workspace.evolutionScore =
    mutations.length > 0 ? successCount / mutations.length : 0

  workspace.metadata.mutations = mutations.slice(-100) // keep last 100
  return saveBranchWorkspace(workspace)
}

// Effect.js wrappers for robust error tracking
export function getCurrentBranchSafe() {
  return Effect.sync(() => getCurrentBranch()).pipe(
    Effect.catchAll((_e: unknown) => Effect.succeed(undefined)),
  )
}

export function switchBranchContextSafe(
  newBranch: string,
  previousBranch?: string,
) {
  return Effect.sync(() => switchBranchContext(newBranch, previousBranch)).pipe(
    Effect.catchAll((e: unknown) => Effect.fail(String(e))),
  )
}

export function autoDetectAndSwitchSafe(previousBranch?: string) {
  return Effect.sync(() => autoDetectAndSwitch(previousBranch)).pipe(
    Effect.catchAll((e: unknown) => Effect.fail(String(e))),
  )
}
