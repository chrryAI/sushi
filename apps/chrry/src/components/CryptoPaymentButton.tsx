import { useState } from "react"

const USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"

function pad64(hex: string) {
  return hex.replace("0x", "").padStart(64, "0")
}

function buildTransferData(to: string, amountUnits: bigint) {
  const selector = "a9059cbb"
  const recipient = pad64(to)
  const value = pad64(`0x${amountUnits.toString(16)}`)
  return `0x${selector + recipient + value}`
}

interface CryptoPaymentButtonProps {
  usdAmount: number
  onSuccess?: (result: { creditsAdded: number; txHash: string }) => void
  onError?: (error: string) => void
}

export function CryptoPaymentButton({
  usdAmount,
  onSuccess,
  onError,
}: CryptoPaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  const walletAddress = import.meta.env.VITE_CRYPTO_WALLET_ADDRESS as string

  const handlePay = async () => {
    if (!walletAddress) {
      onError?.("Wallet address not configured")
      return
    }

    const ethereum = (window as any).ethereum
    if (!ethereum) {
      onError?.("MetaMask not found. Please install the extension.")
      return
    }

    setLoading(true)
    try {
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      })
      const from = accounts[0]
      if (!from) throw new Error("No account selected")

      const amountUnits = BigInt(Math.round(usdAmount * 1_000_000))
      const data = buildTransferData(walletAddress, amountUnits)

      const txHash: string = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: USDC_POLYGON,
            data,
            gas: "0x186a0", // 100k gas limit
          },
        ],
      })

      // Verify on backend
      const res = await fetch("/api/crypto/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, plan: "credits" }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Verification failed")
      }

      onSuccess?.({ creditsAdded: result.creditsAdded, txHash })
    } catch (err: any) {
      onError?.(err.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="crypto-pay-button"
      style={{
        padding: "12px 24px",
        borderRadius: "8px",
        background: "#f6851b",
        color: "#fff",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 600,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Processing..." : `Pay ${usdAmount} USDC with MetaMask`}
    </button>
  )
}
