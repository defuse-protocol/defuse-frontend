"use client"

// TODO(test-cleanup): This entire /gifts/view/test directory is for visual testing. Delete this directory when no longer needed and remove storageType from GiftRevealCard.

import { GiftClaimedInfo } from "@src/components/DefuseSDK/features/gift/components/GiftClaimedInfo"
import { clearGiftRevealState } from "@src/components/DefuseSDK/features/gift/components/GiftRevealCard"
import { GiftTakerInvalidClaim } from "@src/components/DefuseSDK/features/gift/components/GiftTakerInvalidClaim"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useTokenList } from "@src/hooks/useTokenList"
import { useState } from "react"
import { TestClaimReady } from "./_components/TestClaimReady"
import { TestLoading } from "./_components/TestLoading"
import { TestSuccess } from "./_components/TestSuccess"

type TestMode =
  | "loading"
  | "reveal"
  | "success"
  | "claimed"
  | "invalid"
  | "error"

const TEST_MODES: { mode: TestMode; label: string }[] = [
  { mode: "loading", label: "Loading" },
  { mode: "reveal", label: "Reveal" },
  { mode: "success", label: "Success" },
  { mode: "claimed", label: "Claimed" },
  { mode: "invalid", label: "Invalid" },
  { mode: "error", label: "Error" },
]

const MOCK_GIFT_ID = "test-gift-123"

export default function GiftTestPage() {
  const [mode, setMode] = useState<TestMode>("reveal")
  const tokenList = useTokenList(LIST_TOKENS)
  const testToken = tokenList[0]

  const handleModeChange = (newMode: TestMode) => {
    if (newMode === "reveal") {
      clearGiftRevealState(MOCK_GIFT_ID, "session")
    }
    setMode(newMode)
  }

  return (
    <Paper>
      <div className="relative w-full">
        <div className="fixed right-5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-50">
          {TEST_MODES.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => handleModeChange(item.mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                mode === item.mode
                  ? "bg-gray-900 text-white pointer-events-none"
                  : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200 cursor-pointer"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <TestContent
          mode={mode}
          token={testToken}
          giftId={MOCK_GIFT_ID}
          onClaim={() => setMode("success")}
        />
      </div>
    </Paper>
  )
}

function TestContent({
  mode,
  token,
  giftId,
  onClaim,
}: {
  mode: TestMode
  token: ReturnType<typeof useTokenList>[0]
  giftId: string
  onClaim: () => void
}) {
  const mockAmount = { amount: 1000000000000000000n, decimals: 18 }

  switch (mode) {
    case "loading":
      return <TestLoading />
    case "reveal":
      return <TestClaimReady token={token} giftId={giftId} onClaim={onClaim} />
    case "success":
      return <TestSuccess token={token} />
    case "claimed":
      return token ? (
        <GiftClaimedInfo token={token} amount={mockAmount} />
      ) : null
    case "invalid":
      return <GiftTakerInvalidClaim error="INVALID_PAYLOAD" />
    case "error":
      return <GiftTakerInvalidClaim error="UNKNOWN_ERROR" />
  }
}
