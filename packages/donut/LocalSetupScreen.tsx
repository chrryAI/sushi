import { useEffect, useRef, useState } from "react"
import { useAppContext } from "./context/AppContext"

interface ServiceStatus {
  name: string
  status: "starting" | "healthy" | "unhealthy" | "stopped"
}

interface LocalServicesStatus {
  docker: boolean
  services: ServiceStatus[]
  api: boolean
  all_ready: boolean
}

const SERVICE_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  redis: "Redis",
  minio: "MinIO",
  minio_init: "Storage Init",
  falkordb: "FalkorDB",
}

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    healthy: "#22c55e",
    starting: "#f59e0b",
    unhealthy: "#ef4444",
    stopped: "#6b7280",
  }
  const animations: Record<string, string> = {
    starting: "pulse 1.5s infinite",
    healthy: "none",
  }
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] ?? "#6b7280",
        animation: animations[status] ?? "none",
        flexShrink: 0,
      }}
    />
  )
}

interface LocalSetupScreenProps {
  onReady: () => void
  children?: React.ReactNode
}

export default function LocalSetupScreen({
  onReady,
  children,
}: LocalSetupScreenProps) {
  const [dockerMissing, setDockerMissing] = useState(false)
  const [status, setStatus] = useState<LocalServicesStatus | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { t } = useAppContext()
  const poll = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      const s = await invoke<LocalServicesStatus>("get_service_status")
      setStatus(s)
      if (s.all_ready) {
        if (pollRef.current) clearInterval(pollRef.current)
        setTimeout(onReady, 800)
      }
    } catch (e) {
      console.error("status poll error", e)
    }
  }

  useEffect(() => {
    const startAndPoll = async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      // 1. Check Docker
      const dockerOk = await invoke<boolean>("check_docker")
      if (!dockerOk) {
        setDockerMissing(true)
        return
      }

      // 2. Fire docker compose up -d
      try {
        await invoke("start_services")
      } catch (e) {
        console.error("start_services failed:", e)
        // still poll — services might already be running
      }

      // 3. Poll every 2s until all_ready
      poll()
      pollRef.current = setInterval(poll, 2000)
    }

    startAndPoll()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Docker missing screen ──────────────────────────────────────────────────
  if (dockerMissing) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐳</div>
          <h2 style={styles.title}>OrbStack Required</h2>
          <p style={styles.subtitle}>
            {t(`Watermelon runs your AI stack locally. Install OrbStack to get
            started — it's lightweight and uses the macOS Virtualization
            framework.`)}
          </p>
          <a
            href="https://orbstack.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.button}
          >
            Download OrbStack →
          </a>
          <p style={{ ...styles.hint, marginTop: 16 }}>
            Docker Desktop also works if you already have it.
          </p>
        </div>
      </div>
    )
  }

  // ── Service status screen ──────────────────────────────────────────────────
  const services: ServiceStatus[] = status?.services ?? [
    { name: "postgres", status: "starting" },
    { name: "redis", status: "stopped" },
    { name: "minio", status: "stopped" },
    { name: "falkordb", status: "stopped" },
  ]

  const apiStatus: ServiceStatus = {
    name: "api",
    status: status?.api ? "healthy" : "starting",
  }

  const allServices = [
    ...services.filter((s) => s.name !== "minio-init"),
    apiStatus,
  ]
  const healthyCount = allServices.filter((s) => s.status === "healthy").length
  const progress = Math.round((healthyCount / allServices.length) * 100)

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍉</div>
        <h2 style={styles.title}>{t("Starting Watermelon")}</h2>
        <p style={styles.subtitle}>{t("Setting up your local AI stack…")}</p>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${progress}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>

        {/* Service list */}
        <div style={styles.serviceList}>
          <ServiceRow
            label="Docker"
            status={status?.docker ? "healthy" : "starting"}
          />
          {allServices.map((s) => (
            <ServiceRow
              key={s.name}
              label={SERVICE_LABELS[s.name] ?? s.name}
              status={s.status}
            />
          ))}
        </div>

        <p style={styles.hint}>
          {t(
            "First launch pulls Docker images — this only takes a minute once.",
          )}
        </p>
      </div>
      {children}
    </div>
  )
}

function ServiceRow({ label, status }: { label: string; status: string }) {
  const { t } = useAppContext()
  const text: Record<string, string> = {
    healthy: "Ready",
    starting: "Starting…",
    unhealthy: "Error",
    stopped: "Waiting",
  }
  return (
    <div style={styles.serviceRow}>
      <StatusDot status={status} />
      <span style={{ flex: 1, color: "var(--text-1, #e4e4e7)" }}>{label}</span>
      <span
        style={{
          fontSize: "0.75rem",
          color:
            status === "healthy"
              ? "#22c55e"
              : status === "unhealthy"
                ? "#ef4444"
                : "#a1a1aa",
        }}
      >
        {t(text[status] ?? status)}
      </span>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  card: {
    width: 360,
    padding: "40px 32px",
    background: "#18181b",
    borderRadius: 16,
    border: "1px solid #27272a",
    textAlign: "center",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#fafafa",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: "0.875rem",
    color: "#a1a1aa",
    lineHeight: 1.6,
  },
  progressTrack: {
    height: 4,
    background: "#27272a",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    borderRadius: 4,
  },
  serviceList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 24,
    textAlign: "left",
  },
  serviceRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.875rem",
  },
  button: {
    display: "inline-block",
    padding: "10px 20px",
    background: "#22c55e",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  hint: {
    fontSize: "0.75rem",
    color: "#52525b",
    margin: 0,
  },
}
