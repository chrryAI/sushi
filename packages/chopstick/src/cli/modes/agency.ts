import * as p from "@clack/prompts"

const CHRRY_API = "https://api.chrry.dev"

export async function setupAgency() {
  p.log.step("🚀 Agency setup — we host it for you")

  p.note(
    [
      "What you get:",
      "  • Dedicated container on our swarm",
      "  • [yourapp].chrry.ai subdomain",
      "  • Managed updates & backups",
      "  • 99.9% uptime SLA",
      "",
      "Price: $5,000/mo",
    ].join("\n"),
    "Agency Plan",
  )

  const proceed = await p.confirm({
    message: "Continue with agency setup?",
    initialValue: true,
  })
  if (p.isCancel(proceed) || !proceed) {
    process.exit(0)
  }

  // ── Collect info ──────────────────────────────────────────────
  const email = await p.text({
    message: "Your email address",
    placeholder: "you@company.com",
    validate: (v) => (v.includes("@") ? undefined : "Valid email required"),
  })
  if (p.isCancel(email)) {
    process.exit(0)
  }

  const appName = await p.text({
    message: "App name (will become [name].chrry.ai)",
    placeholder: "myapp",
    validate: (v) => {
      if (!v.trim()) return "Required"
      if (!/^[a-z0-9-]+$/.test(v))
        return "Only lowercase letters, numbers, and hyphens"
      return undefined
    },
  })
  if (p.isCancel(appName)) {
    process.exit(0)
  }

  const plan = await p.select({
    message: "Billing cycle",
    options: [
      { value: "monthly", label: "Monthly", hint: "$5,000/mo" },
      { value: "annual", label: "Annual", hint: "$50,000/yr (2 months free)" },
    ],
  })
  if (p.isCancel(plan)) {
    process.exit(0)
  }

  // ── Register with chrry API ───────────────────────────────────
  const s = p.spinner()
  s.start("Registering your agency slot...")

  try {
    const res = await fetch(`${CHRRY_API}/api/agency/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, appName, plan }),
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any
      throw new Error(err.message ?? `Server error ${res.status}`)
    }

    const data = (await res.json()) as any
    s.stop("✓ Registered!")

    p.log.success("Agency slot created!")
    p.note(
      [
        `App URL:    https://${appName}.chrry.ai`,
        `Dashboard:  https://app.chrry.dev/agency/${data.id}`,
        `API Key:    ${data.apiKey ?? "(sent to your email)"}`,
        "",
        "Check your email for next steps & payment link.",
      ].join("\n"),
      "Your Agency Setup",
    )
  } catch (err: any) {
    s.stop("✗ Registration failed")
    p.log.error(err.message)
    p.note(
      "Email us at hello@chrry.ai to complete setup manually.",
      "Need help?",
    )
  }
}
