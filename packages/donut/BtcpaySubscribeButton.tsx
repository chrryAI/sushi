"use client"

import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

import { COLORS, useAppContext } from "./context/AppContext"
import { useAuth } from "./context/providers"
import { useStyles } from "./context/StylesContext"
import Loading from "./Loading"
import { Button, Div, P, Span } from "./platform"
import type { subscription } from "./types"
import { apiFetch } from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"
import {
  AGENCY_PRICE,
  PLUS_PRICE,
  PRO_PRICE,
  SOVEREIGN_PRICE,
} from "./utils/index"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BtcpayPlan = "plus" | "pro" | "agency" | "sovereign"

interface BtcpaySubscribeButtonProps {
  /** Pre-selected plan */
  plan?: BtcpayPlan
  /** Additional className */
  className?: string
  /** Inline style */
  style?: React.CSSProperties
  /** Called after successful payment confirmation */
  onPaymentVerified?: (data: { invoiceId: string; plan: BtcpayPlan }) => void
  /** Called when subscription is activated via webhook/polling */
  onSubscriptionActivated?: (plan: BtcpayPlan) => void
  /** Disable the button */
  disabled?: boolean
}

// ─── Plan Configuration ────────────────────────────────────────────────────────

const planConfig: Record<
  BtcpayPlan,
  { name: string; price: number; emoji: string; description: string }
> = {
  plus: {
    name: "Plus",
    price: PLUS_PRICE,
    emoji: "🍓",
    description: "Enhanced AI with more credits",
  },
  pro: {
    name: "Pro",
    price: PRO_PRICE,
    emoji: "🫐",
    description: "Full power with API keys & priority",
  },
  agency: {
    name: "Agency",
    price: AGENCY_PRICE,
    emoji: "🍉",
    description: "Team collaboration & agency deployment",
  },
  sovereign: {
    name: "Sovereign",
    price: SOVEREIGN_PRICE,
    emoji: "🏯",
    description: "Private instance & unlimited sovereignty",
  },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BtcpaySubscribeButton({
  plan: initialPlan = "plus",
  className = "",
  style,
  onPaymentVerified,
  onSubscriptionActivated,
  disabled = false,
}: BtcpaySubscribeButtonProps) {
  const { t } = useAppContext()
  const { user, guest, token, fetchSession, plausible, API_URL, FRONTEND_URL } =
    useAuth()
  const { utilities } = useStyles()

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<BtcpayPlan>(initialPlan)
  const [loading, setLoading] = useState(false)

  // BTCPay invoice state
  const [btcpayInvoice, setBtcpayInvoice] = useState<{
    invoiceId: string
    checkoutUrl: string
    amount: number
    currency: string
  } | null>(null)
  const [isBtcpayLoading, setIsBtcpayLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "idle" | "checking" | "active" | "expired" | "none"
  >("idle")

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auth state
  const isAuthenticated = !!(user || guest)
  const currentSubscription = (user || guest)?.subscription as
    | subscription
    | undefined
  const currentPlan = currentSubscription?.plan as BtcpayPlan | undefined

  // ── Cleanup polling on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  // ── Create BTCPay Invoice ─────────────────────────────────────────────────
  const createBtcpayInvoice = async () => {
    if (!isAuthenticated) {
      toast.error(t("Please sign in to subscribe"))
      return
    }

    setIsBtcpayLoading(true)
    setLoading(true)
    plausible({ name: ANALYTICS_EVENTS.SUBSCRIBE_CHECKOUT })

    try {
      const response = await apiFetch(`${API_URL}/btcpay/create-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          successUrl: `${FRONTEND_URL}/subscription/success`,
          cancelUrl: `${FRONTEND_URL}/subscription/cancel`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBtcpayInvoice(data)
        setIsPaymentModalOpen(true)
        startBtcpayPolling(data.invoiceId)
      } else {
        toast.error(data.error || t("Failed to create Bitcoin invoice"))
      }
    } catch (error) {
      console.error("BTCPay invoice error:", error)
      toast.error(t("Failed to create Bitcoin invoice"))
    } finally {
      setIsBtcpayLoading(false)
      setLoading(false)
    }
  }

  // ── BTCPay Invoice Polling ─────────────────────────────────────────────────
  const startBtcpayPolling = (invoiceId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    let pollCount = 0
    const MAX_POLLS = 720 // 60 mins at 5s intervals

    pollingRef.current = setInterval(async () => {
      pollCount++
      if (pollCount > MAX_POLLS) {
        clearInterval(pollingRef.current!)
        pollingRef.current = null
        toast.error(t("Payment timeout — invoice expired"))
        closePaymentModal()
        return
      }

      try {
        const response = await apiFetch(
          `${API_URL}/btcpay/invoice/${invoiceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        const data = await response.json()

        if (!data.success) return

        const status = data.invoice?.status

        if (status === "Settled" || status === "Processing") {
          // Payment confirmed!
          clearInterval(pollingRef.current!)
          pollingRef.current = null

          toast.success(`⚡ ${t("Payment received! Verifying...")}`)

          // Verify payment on backend to activate subscription/credits
          try {
            const verifyRes = await apiFetch(
              `${API_URL}/btcpay/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ invoiceId }),
              },
            )
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              toast.success(t("Subscribed"))
            } else if (verifyData.message === "Already processed") {
              toast.success(t("Already activated"))
            } else {
              toast.error(verifyData.error || t("Verification failed"))
            }
          } catch (verifyErr) {
            console.error("BTCPay verify error:", verifyErr)
            toast.error(t("Verification request failed"))
          }

          plausible({
            name: ANALYTICS_EVENTS.SUBSCRIBE_PAYMENT_VERIFIED,
          })

          // Refresh session to get updated subscription
          await fetchSession()

          // Callbacks
          onPaymentVerified?.({ invoiceId, plan: selectedPlan })
          onSubscriptionActivated?.(selectedPlan)

          closePaymentModal()
          setSubscriptionStatus("active")
        } else if (status === "Expired" || status === "Invalid") {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
          toast.error(
            status === "Expired"
              ? t("Payment expired")
              : t("Payment failed or invalid"),
          )
          closePaymentModal()
          setSubscriptionStatus("expired")
        }
        // If status is still "New" — keep polling silently
      } catch (error) {
        console.error("Polling error:", error)
        // Don't stop polling on transient errors — just skip this round
      }
    }, 5000) // Poll every 5 seconds
  }

  // ── Close Payment Modal ────────────────────────────────────────────────────
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setBtcpayInvoice(null)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // ── Check Subscription Status ──────────────────────────────────────────────
  const checkSubscriptionStatus = async () => {
    if (!isAuthenticated) {
      setSubscriptionStatus("none")
      return
    }

    setSubscriptionStatus("checking")

    try {
      const response = await apiFetch(`${API_URL}/btcpay/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success && data.invoices?.length > 0) {
        // Check the latest settled invoice
        const settledInvoices = data.invoices.filter(
          (inv: any) => inv.status === "Settled",
        )

        if (settledInvoices.length > 0) {
          setSubscriptionStatus("active")
        } else {
          const latest = data.invoices[0]
          if (latest.status === "Expired" || latest.status === "Invalid") {
            setSubscriptionStatus("expired")
          } else {
            setSubscriptionStatus("none")
          }
        }
      } else {
        // Fallback: check the user/guest subscription directly
        if (currentSubscription) {
          setSubscriptionStatus("active")
        } else {
          setSubscriptionStatus("none")
        }
      }
    } catch (error) {
      console.error("Error checking subscription status:", error)
      // Fallback to direct subscription check
      setSubscriptionStatus(currentSubscription ? "active" : "none")
    }
  }

  // ── Plan Selection Helpers ─────────────────────────────────────────────────
  const isCurrentPlan = (plan: BtcpayPlan) => currentPlan === plan
  const isPlanHigher = (plan: BtcpayPlan) => {
    if (!currentPlan) return false
    const order: BtcpayPlan[] = ["plus", "pro", "agency", "sovereign"]
    return order.indexOf(plan) > order.indexOf(currentPlan)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Div className={className} style={style}>
      {/* ── Plan Selection ──────────────────────────────────────────────────── */}
      <Div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {(Object.keys(planConfig) as BtcpayPlan[]).map((plan) => {
          const info = planConfig[plan]
          const isCurrent = isCurrentPlan(plan)
          const isHigher = isPlanHigher(plan)

          return (
            <Button
              key={plan}
              data-testid={`btcpay-plan-${plan}`}
              onClick={() => setSelectedPlan(plan)}
              disabled={isCurrent}
              style={
                selectedPlan === plan
                  ? { ...utilities.inverted.style }
                  : { ...utilities.transparent.style }
              }
            >
              <Span>{info.emoji}</Span> <Span>{t(info.name)}</Span>
              {isCurrent && (
                <Span style={{ fontSize: 11, opacity: 0.7 }}>
                  {" "}
                  ({t("Current")})
                </Span>
              )}
              {isHigher && (
                <Span style={{ fontSize: 11, opacity: 0.7 }}> ↑</Span>
              )}
            </Button>
          )
        })}
      </Div>

      {/* ── Plan Info ───────────────────────────────────────────────────────── */}
      <Div
        style={{
          textAlign: "center",
          marginBottom: 12,
          padding: "8px 12px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--shade-2)",
        }}
      >
        <P
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          {planConfig[selectedPlan].emoji} {planConfig[selectedPlan].name} — €
          {planConfig[selectedPlan].price}/{t("month")}
        </P>
        <P
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: "var(--shade-7)",
          }}
        >
          {t(planConfig[selectedPlan].description)}
        </P>
      </Div>

      {/* ── Bitcoin Pay Button ──────────────────────────────────────────────── */}
      {!isCurrentPlan(selectedPlan) && (
        <Button
          disabled={isBtcpayLoading || disabled || !isAuthenticated}
          data-testid="btcpay-checkout"
          onClick={() => {
            createBtcpayInvoice()
          }}
          style={{
            ...utilities.button.style,
            backgroundColor: "#f7931a",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "12px 16px",
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          {isBtcpayLoading ? (
            <Loading color="#fff" />
          ) : (
            <>
              <Span style={{ fontSize: "1.2em" }}>₿</Span>
              <Span>
                {isAuthenticated
                  ? `${t("Pay with Bitcoin")} — €${planConfig[selectedPlan].price}/${t("month")}`
                  : t("Sign in to subscribe")}
              </Span>
            </>
          )}
        </Button>
      )}

      {/* ── Auth Prompt ─────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <P
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--shade-7)",
            marginTop: 8,
          }}
        >
          {t("Sign in to subscribe with Bitcoin")}
        </P>
      )}

      {/* ── Current Plan Indicator ──────────────────────────────────────────── */}
      {isCurrentPlan(selectedPlan) && (
        <Div
          style={{
            textAlign: "center",
            padding: "8px 12px",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--shade-1)",
            marginTop: 4,
          }}
        >
          <P
            style={{
              margin: 0,
              color: "var(--shade-7)",
              fontSize: 14,
            }}
          >
            ✓ {t("You are currently on this plan")}
          </P>
        </Div>
      )}

      {/* ── Payment Modal ───────────────────────────────────────────────────── */}
      {isPaymentModalOpen && btcpayInvoice && (
        <Div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <Div
            style={{
              backgroundColor: "var(--background)",
              borderRadius: 16,
              padding: "28px",
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                color: "#f7931a",
                fontSize: "1.5rem",
              }}
            >
              ₿ {t("Pay with Bitcoin")}
            </h2>
            <P
              style={{
                margin: "0 0 4px",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              {btcpayInvoice.amount} {btcpayInvoice.currency}
            </P>
            <P
              style={{
                margin: "0 0 16px",
                fontSize: "0.75rem",
                color: "var(--shade-7)",
              }}
            >
              {t("Invoice")}: {btcpayInvoice.invoiceId.slice(0, 16)}...
            </P>

            <Div style={{ margin: "20px 0" }}>
              <a
                className="button"
                href={btcpayInvoice.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: COLORS.orange,
                  color: "#fff",
                  borderRadius: 12,
                  textDecoration: "none",
                }}
              >
                ⚡ {t("Open Payment Page")}
              </a>
            </Div>

            <Div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "var(--shade-1)",
                borderRadius: 8,
              }}
            >
              <P
                style={{
                  fontSize: 13,
                  color: "var(--shade-7)",
                  margin: "0 0 4px",
                }}
              >
                ⏳ {t("Waiting for confirmation...")}
              </P>
              <P
                style={{
                  fontSize: 11,
                  color: "var(--shade-6)",
                  margin: 0,
                }}
              >
                {t("Lightning Network + On-chain")}
              </P>
            </Div>

            <Button
              onClick={closePaymentModal}
              className="link"
              style={{
                marginTop: 20,
                color: "var(--shade-6)",
                fontSize: "0.9rem",
              }}
            >
              {t("Cancel")}
            </Button>
          </Div>
        </Div>
      )}
    </Div>
  )
}

// ─── Subscription Status Checker ────────────────────────────────────────────────

export function SubscriptionStatus() {
  const { t } = useAppContext()
  const { user, guest, token, API_URL } = useAuth()
  const { utilities } = useStyles()

  const [status, setStatus] = useState<
    "idle" | "checking" | "active" | "expired" | "none"
  >("idle")
  const [planName, setPlanName] = useState<string | null>(null)

  const isAuthenticated = !!(user || guest)

  const checkStatus = async () => {
    if (!isAuthenticated || !token) {
      setStatus("none")
      return
    }

    setStatus("checking")

    try {
      // First check if user already has a subscription
      const currentSub = (user || guest)?.subscription
      if (currentSub) {
        setStatus("active")
        setPlanName(currentSub.plan)
        return
      }

      // Then check BTCPay invoices
      const response = await apiFetch(`${API_URL}/btcpay/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success && data.invoices?.length > 0) {
        const settled = data.invoices.find(
          (inv: any) => inv.status === "Settled",
        )
        if (settled) {
          setStatus("active")
          setPlanName(settled.plan)
        } else {
          const latest = data.invoices[0]
          if (latest.status === "Expired" || latest.status === "Invalid") {
            setStatus("expired")
            setPlanName(latest.plan)
          } else {
            setStatus("none")
          }
        }
      } else {
        setStatus("none")
      }
    } catch (error) {
      console.error("Error checking subscription status:", error)
      // Fallback
      const currentSub = (user || guest)?.subscription
      setStatus(currentSub ? "active" : "none")
      setPlanName(currentSub?.plan || null)
    }
  }

  // Auto-check on auth change
  useEffect(() => {
    if (isAuthenticated) {
      checkStatus()
    } else {
      setStatus("none")
    }
  }, [isAuthenticated, (user || guest)?.subscription])

  const statusDisplay: Record<
    string,
    { emoji: string; color: string; label: string }
  > = {
    idle: { emoji: "⚪", color: "var(--shade-6)", label: t("Check status") },
    checking: {
      emoji: "🔄",
      color: "var(--shade-7)",
      label: t("Checking..."),
    },
    active: {
      emoji: "🟢",
      color: "var(--accent-4)",
      label: planName
        ? t("Active — {{plan}}", { plan: planName })
        : t("Active"),
    },
    expired: {
      emoji: "🟡",
      color: "var(--shade-7)",
      label: t("Expired — Renew now"),
    },
    none: {
      emoji: "⚪",
      color: "var(--shade-6)",
      label: t("No subscription"),
    },
  }

  const display: { emoji: string; color: string; label: string } =
    statusDisplay[status] ||
      statusDisplay.none || {
        emoji: "⚪",
        color: "var(--shade-6)",
        label: "No subscription",
      }

  return (
    <Div
      style={{
        padding: "8px 12px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--shade-2)",
        backgroundColor: "var(--shade-1)",
      }}
    >
      <Div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Span style={{ fontSize: 18 }}>{display.emoji}</Span>
        <Span
          style={{
            fontWeight: 500,
            color: display.color,
          }}
        >
          {display.label}
        </Span>
        <Button
          onClick={checkStatus}
          className="link"
          style={{
            marginLeft: "auto",
            fontSize: 13,
          }}
        >
          {status === "checking" ? "..." : t("Refresh")}
        </Button>
      </Div>
    </Div>
  )
}
