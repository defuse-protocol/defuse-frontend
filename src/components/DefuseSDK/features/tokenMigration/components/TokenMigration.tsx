import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { useEffect, useState } from "react"
import type { SignMessage } from "../../otcDesk/types/sharedTypes"
import { TokenMigrationDialog } from "./TokenMigrationDialog"

interface TokenMigrationProps {
  /** User's wallet address */
  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  signMessage: SignMessage
}

export function TokenMigration({
  userAddress,
  userChainType,
  signMessage,
}: TokenMigrationProps) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (userAddress != null && userChainType != null) {
      setEnabled(true)
    }
  }, [userAddress, userChainType])

  if (!enabled || userAddress == null || userChainType == null) {
    return null
  }

  return (
    <TokenMigrationDialog
      userAddress={userAddress}
      userChainType={userChainType}
      signMessage={signMessage}
      onExit={() => setEnabled(false)}
    />
  )
}
