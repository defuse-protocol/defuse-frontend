import { WarningCircleIcon } from "@phosphor-icons/react"
import AppButton from "@src/components/Button"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { deriveIdFromIV } from "@src/utils/deriveIdFromIV"
import { logger } from "@src/utils/logger"
import { useCallback, useMemo, useState } from "react"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import { giftMakerHistoryStore } from "../stores/giftMakerHistory"
import type { GiftInfo } from "../utils/parseGiftInfos"
import { GiftExpirationInput } from "./GiftExpirationInput"

type GiftExpirationEditDialogProps = {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
  onClose: () => void
}

export function GiftExpirationEditDialog({
  giftInfo,
  signerCredentials,
  onClose,
}: GiftExpirationEditDialogProps) {
  const [expiresAt, setExpiresAt] = useState<number | null>(
    giftInfo.expiresAt ?? null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const giftId = useMemo(() => {
    if (!giftInfo.iv) return null
    return deriveIdFromIV(giftInfo.iv)
  }, [giftInfo.iv])

  const handleSave = useCallback(async () => {
    if (!giftId) {
      setError("Cannot update: gift ID not available")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expires_at: expiresAt }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update expiration")
      }

      const result = await giftMakerHistoryStore
        .getState()
        .updateExpiration(giftInfo.secretKey, signerCredentials, expiresAt)

      if (result.tag === "err") {
        logger.error(
          new Error("Failed to update local expiration", {
            cause: result.reason,
          })
        )
      }

      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update"
      setError(message)
      logger.error(new Error("Failed to update expiration", { cause: err }))
    } finally {
      setIsSubmitting(false)
    }
  }, [expiresAt, giftId, giftInfo.secretKey, signerCredentials, onClose])

  return (
    <BaseModalDialog open title="Edit Expiration" onClose={onClose}>
      <div className="mt-4">
        <GiftExpirationInput
          value={expiresAt}
          onChange={setExpiresAt}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <WarningCircleIcon
            weight="bold"
            className="size-4 text-red-11 shrink-0"
          />
          <span className="text-sm font-medium text-red-11">{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <AppButton
          type="button"
          variant="outline"
          size="xl"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:flex-1"
        >
          Cancel
        </AppButton>
        <AppButton
          type="button"
          variant="primary"
          size="xl"
          onClick={handleSave}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full sm:flex-1"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </AppButton>
      </div>
    </BaseModalDialog>
  )
}
