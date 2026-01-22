import type { MultiPayload } from "@defuse-protocol/contract-types"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { ArrowLongRightIcon } from "@heroicons/react/16/solid"
import { PlusIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import ListItem from "@src/components/ListItem"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import { useQuery } from "@tanstack/react-query"
import { None, type Option, Some } from "@thames/monads"
import { useState } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import ModalActiveDeal from "../../../components/Modal/ModalActiveDeal"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import { isNonceUsed } from "../../../services/intentsContractService"
import type { TokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import { computeTotalBalanceDifferentDecimals } from "../../../utils/tokenUtils"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import { useCountdownTimer } from "../hooks/useCountdownTimer"
import { useOtcMakerTrades } from "../stores/otcMakerTrades"
import type { GenerateLink, SignMessage } from "../types/sharedTypes"
import {
  type DetermineInvolvedTokensErr,
  determineInvolvedTokens,
} from "../utils/deriveTradeTerms"
import {
  type ParseTradeTermsErr,
  type TradeTerms,
  parseTradeTerms,
} from "../utils/parseTradeTerms"

interface OtcMakerTradesProps {
  tokenList: TokenInfo[]
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  signMessage: SignMessage
  sendNearTransaction: SendNearTransaction
}

type TradeSelection = {
  tradeId: string
  pKey: string
  iv: string
  multiPayload: MultiPayload
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  nonceBase64: string
  error:
    | "ORDER_EXPIRED"
    | "NONCE_ALREADY_USED"
    | "MAKER_INSUFFICIENT_FUNDS"
    | null
}

type SelectedTrade = TradeSelection | null

export function OtcMakerTrades({
  tokenList,
  generateLink,
  signerCredentials,
  signMessage,
  sendNearTransaction,
}: OtcMakerTradesProps) {
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade>(null)

  const trades = useOtcMakerTrades((s) => {
    const userId = authIdentity.authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    )
    return s.trades[userId]
  })

  if (trades == null || trades.length === 0) {
    return (
      <section className="mt-9">
        <ListItemsSkeleton count={3} className="mt-2" />
        <div className="max-w-72 mx-auto -mt-5 relative flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-900 text-center tracking-tight">
            No deals yet
          </h3>
          <p className="text-base text-gray-500 mt-1 font-medium text-center text-balance">
            Create a deal to get started.
          </p>
          <Button href="/deals/new" size="xl" className="mt-4">
            <PlusIcon className="size-5 shrink-0" />
            Create a deal
          </Button>
        </div>
      </section>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-1">
        {trades.map((trade) => (
          <OtcMakerTradeItem
            key={trade.tradeId}
            tradeId={trade.tradeId}
            pKey={trade.pKey}
            iv={trade.iv}
            multiPayload={trade.makerMultiPayload}
            updatedAt={trade.updatedAt}
            tokenList={tokenList}
            generateLink={generateLink}
            signerCredentials={signerCredentials}
            onSelect={(tradeData) => setSelectedTrade(tradeData)}
          />
        ))}
      </div>

      {selectedTrade != null && (
        <ModalActiveDeal
          open={true}
          onClose={() => setSelectedTrade(null)}
          tokenIn={selectedTrade.tokenIn}
          tokenOut={selectedTrade.tokenOut}
          tradeId={selectedTrade.tradeId}
          pKey={selectedTrade.pKey}
          iv={selectedTrade.iv}
          multiPayload={selectedTrade.multiPayload}
          nonceBase64={selectedTrade.nonceBase64}
          generateLink={generateLink}
          signerCredentials={signerCredentials}
          signMessage={signMessage}
          sendNearTransaction={sendNearTransaction}
          error={selectedTrade.error}
        />
      )}
    </div>
  )
}

interface OtcMakerTradeItemProps {
  tradeId: string
  pKey: string
  iv: string
  multiPayload: MultiPayload
  updatedAt: number
  tokenList: TokenInfo[]
  generateLink: GenerateLink
  signerCredentials: SignerCredentials
  onSelect: (trade: SelectedTrade) => void
}

function OtcMakerTradeItem({
  tradeId,
  pKey,
  iv,
  multiPayload,
  tokenList,
  onSelect,
}: OtcMakerTradeItemProps) {
  const tradeTermsResult = parseTradeTerms(multiPayload)
    .mapErr<ParseTradeTermsErr | DetermineInvolvedTokensErr>((a) => a)
    .andThen((tradeTerms) =>
      determineInvolvedTokens(tokenList, tradeTerms.tokenDiff).map(
        ({ tokenIn, tokenOut }) => ({
          tradeTerms: tradeTerms,
          tokenIn: tokenIn,
          tokenOut: tokenOut,
        })
      )
    )

  if (tradeTermsResult.isErr()) {
    return <div>Error: {tradeTermsResult.unwrapErr()}</div>
  }

  const { tradeTerms, tokenIn, tokenOut } = tradeTermsResult.unwrap()

  const totalAmountIn = computeTotalBalanceDifferentDecimals(
    tokenIn,
    tradeTerms.tokenDiff,
    { strict: false }
  )
  assert(totalAmountIn)

  const totalAmountOut = computeTotalBalanceDifferentDecimals(
    tokenOut,
    tradeTerms.tokenDiff,
    { strict: false }
  )
  assert(totalAmountOut)

  const err = useValidateTrade(tradeTerms)
  const hasError = err.isSome()
  const error = hasError ? err.unwrap() : null

  const badgeType = getBadgeType(error)

  const timeLeft = useCountdownTimer({ deadline: tradeTerms.deadline })

  const handleClick = () => {
    onSelect({
      tradeId,
      pKey,
      iv,
      multiPayload,
      tokenIn,
      tokenOut,
      nonceBase64: tradeTerms.nonceBase64,
      error,
    })
  }

  return (
    <ListItem onClick={handleClick} dataTestId="otc-maker-trade-item">
      <AssetComboIcon {...tokenOut} badgeType={badgeType} />
      <ListItem.Content>
        <ListItem.Title className="flex items-center gap-0.5">
          {tokenIn.symbol}
          <ArrowLongRightIcon className="size-4 text-gray-400 shrink-0" />
          {tokenOut.symbol}
        </ListItem.Title>

        {error === "ORDER_EXPIRED" ? (
          <ListItem.Subtitle>Trade expired</ListItem.Subtitle>
        ) : error === "NONCE_ALREADY_USED" ? (
          <ListItem.Subtitle>Trade executed or cancelled</ListItem.Subtitle>
        ) : error === "MAKER_INSUFFICIENT_FUNDS" ? (
          <ListItem.Subtitle className="text-red-600">
            Your balance is too low
          </ListItem.Subtitle>
        ) : (
          <ListItem.Subtitle>{timeLeft}</ListItem.Subtitle>
        )}
      </ListItem.Content>
      <ListItem.Content align="end">
        <ListItem.Title>
          {formatTokenValue(totalAmountOut.amount, totalAmountOut.decimals, {
            fractionDigits: 4,
          })}{" "}
          {tokenOut.symbol}
        </ListItem.Title>
        <ListItem.Subtitle>
          {formatTokenValue(-totalAmountIn.amount, totalAmountIn.decimals, {
            fractionDigits: 4,
          })}{" "}
          {tokenIn.symbol}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  )
}

function useValidateTrade(tradeTerms: TradeTerms) {
  let error: Option<
    "ORDER_EXPIRED" | "NONCE_ALREADY_USED" | "MAKER_INSUFFICIENT_FUNDS"
  > = None

  if (new Date(tradeTerms.deadline) < new Date()) {
    error = Some("ORDER_EXPIRED")
  }

  const makerBalanceValidation = useQuery({
    enabled: error.isNone(),
    queryKey: [
      "deposited_balance",
      tradeTerms.userId,
      Object.keys(tradeTerms.tokenDiff),
    ],
    queryFn: () => {
      return getDepositedBalances(
        tradeTerms.userId as IntentsUserId,
        Object.keys(tradeTerms.tokenDiff),
        nearClient
      )
    },
    select: (makerTokenBalances): Option<"MAKER_INSUFFICIENT_FUNDS"> => {
      for (const [tokenId, amount] of Object.entries(tradeTerms.tokenDiff)) {
        if (amount >= 0) {
          continue
        }

        const balance = makerTokenBalances[tokenId]

        if (balance == null || balance < -amount) {
          return Some("MAKER_INSUFFICIENT_FUNDS")
        }
      }
      return None
    },
  })

  const nonceValidation = useQuery({
    enabled: error.isNone(),
    queryKey: ["nonce_is_used", tradeTerms.userId, tradeTerms.nonceBase64],
    queryFn: async () =>
      isNonceUsed({
        nearClient,
        accountId: tradeTerms.userId,
        nonce: tradeTerms.nonceBase64,
      }),
    select: (nonceIsUsed): Option<"NONCE_ALREADY_USED"> => {
      return nonceIsUsed ? Some("NONCE_ALREADY_USED") : None
    },
  })

  const noError = None as typeof error
  error = noError
    .or(nonceValidation.data ?? noError)
    .or(error)
    .or(makerBalanceValidation.data ?? noError)

  return error
}

const getBadgeType = (error?: string | null) => {
  switch (error) {
    case "ORDER_EXPIRED":
    case "MAKER_INSUFFICIENT_FUNDS":
      return "failed"
    case "NONCE_ALREADY_USED":
      return "success"
    default:
      return "processing"
  }
}
