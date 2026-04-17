import * as p from "@clack/prompts"
import { execa } from "execa"

export async function setupSovereign() {
  p.log.step("🏰 Sovereign setup — self-hosted on your own server")

  const serverIp = await p.text({
    message: "Server IP address",
    placeholder: "162.55.97.114",
    validate: (v) => (v.trim() ? undefined : "Required"),
  })
  if (p.isCancel(serverIp)) {
    process.exit(0)
  }

  const sshUser = await p.text({
    message: "SSH user",
    initialValue: "root",
  })
  if (p.isCancel(sshUser)) {
    process.exit(0)
  }

  const mode = await p.select({
    message: "Deployment mode",
    options: [
      {
        value: "dokploy",
        label: "🚢 Dokploy",
        hint: "Recommended — installs Dokploy + Docker Swarm on your server",
      },
      {
        value: "docker",
        label: "🐳 Docker Compose",
        hint: "Direct docker compose deploy",
      },
    ],
  })
  if (p.isCancel(mode)) {
    process.exit(0)
  }

  if (mode === "dokploy") {
    p.log.info(`Connecting to ${sshUser}@${serverIp}...`)

    const s = p.spinner()
    s.start("Installing Docker + Dokploy on server")
    try {
      await execa("ssh", [
        `${sshUser}@${serverIp}`,
        "curl -sSL https://dokploy.com/install.sh | bash",
      ])
      s.stop("✓ Dokploy installed")
    } catch (err: any) {
      s.stop("✗ Install failed")
      p.log.error(err.message)
    }

    p.log.success(`Dokploy is running at http://${serverIp}:3000`)
    p.note(
      [
        `1. Open http://${serverIp}:3000`,
        "2. Create a new project → Compose",
        "3. Paste your docker-compose.yml",
        "4. Add environment variables",
        "5. Deploy!",
        "",
        "Need help? https://docs.dokploy.com",
      ].join("\n"),
      "Next steps",
    )
  } else {
    // Direct docker compose
    const s = p.spinner()
    s.start("Copying docker-compose.yml to server")
    try {
      await execa("scp", [
        "docker-compose.yml",
        `${sshUser}@${serverIp}:~/vex/docker-compose.yml`,
      ])
      s.stop("✓ Files copied")

      const s2 = p.spinner()
      s2.start("Starting stack on server")
      await execa("ssh", [
        `${sshUser}@${serverIp}`,
        "cd ~/vex && docker compose up -d",
      ])
      s2.stop("✓ Stack started")
    } catch (err: any) {
      s.stop("✗ Failed")
      p.log.error(err.message)
    }
  }
}
