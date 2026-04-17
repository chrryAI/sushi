import * as p from "@clack/prompts"
import { execa } from "execa"

async function run(cmd: string, args: string[], label: string) {
  const s = p.spinner()
  s.start(label)
  try {
    await execa(cmd, args)
    s.stop(`✓ ${label}`)
  } catch (err: any) {
    s.stop(`✗ ${label}`)
    throw new Error(err.stderr || err.message)
  }
}

async function isInstalled(cmd: string) {
  try {
    await execa("which", [cmd])
    return true
  } catch {
    return false
  }
}

async function isRunning(cmd: string, args: string[]) {
  try {
    const { stdout } = await execa(cmd, args)
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

export async function setupLocal() {
  p.log.step("🖥️  Setting up local environment...")

  // ── 1. Colima ─────────────────────────────────────────────────
  const hasColima = await isInstalled("colima")
  if (!hasColima) {
    const install = await p.confirm({
      message: "Colima not found. Install it now? (brew install colima)",
    })
    if (p.isCancel(install) || !install) {
      p.cancel("Colima is required for local mode.")
      process.exit(1)
    }
    await run(
      "brew",
      ["install", "colima", "docker", "docker-compose"],
      "Installing Colima + Docker",
    )
  } else {
    p.log.success("Colima already installed")
  }

  // ── 2. Start Colima ───────────────────────────────────────────
  const colimaRunning = await isRunning("colima", ["status"])
  if (!colimaRunning) {
    await run(
      "colima",
      [
        "start",
        "--cpu",
        "4",
        "--memory",
        "8",
        "--disk",
        "60",
        "--start-with-host",
      ],
      "Starting Colima (this takes ~30s)",
    )
  } else {
    p.log.success("Colima already running")
  }

  // ── 3. Confirm project path ───────────────────────────────────
  const projectPath = await p.text({
    message: "Path to your vex project",
    initialValue: process.cwd(),
    validate: (v) => (v.trim() ? undefined : "Required"),
  })
  if (p.isCancel(projectPath)) {
    process.exit(0)
  }

  // ── 4. Start local stack ──────────────────────────────────────
  await run(
    "docker",
    [
      "compose",
      "-f",
      `${projectPath}/docker-compose.local.yml`,
      "up",
      "-d",
      "postgres",
      "redis",
      "falkordb",
    ],
    "Starting local services (postgres, redis, falkordb)",
  )

  // ── 5. Wait for postgres ──────────────────────────────────────
  const s = p.spinner()
  s.start("Waiting for PostgreSQL to be ready...")
  for (let i = 0; i < 15; i++) {
    try {
      await execa("docker", [
        "exec",
        "vex-postgres-1",
        "pg_isready",
        "-U",
        "vex",
      ])
      break
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  s.stop("✓ PostgreSQL ready")

  // ── 6. Run migrations ─────────────────────────────────────────
  await run(
    "pnpm",
    ["--filter", "@chrryai/machine", "migrate"],
    "Running database migrations",
  )

  // ── 7. Start API ──────────────────────────────────────────────
  const startApi = await p.confirm({
    message: "Start the API server now?",
    initialValue: true,
  })
  if (!p.isCancel(startApi) && startApi) {
    p.log.info("Starting API... (pnpm --filter api dev)")
    const apiProcess = execa("pnpm", ["--filter", "api", "dev"], {
      cwd: projectPath as string,
      stdio: "inherit",
    })
    apiProcess.catch(() => {}) // detached
    p.log.success("API starting on http://localhost:3002")
  }

  p.log.success("Local environment ready!")
  p.note(
    [
      "API:      http://localhost:3002",
      "Postgres: localhost:5432",
      "Redis:    localhost:6379",
      "",
      "To stop:  docker compose down",
    ].join("\n"),
    "Services",
  )
}
