import type { MultiPayload } from "@defuse-protocol/contract-types"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { ArrowDownIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import { useQuery } from "@tanstack/react-query"
import { None } from "@thames/monads"
import { AuthGate } from "../../../components/AuthGate"
import { nearClient } from "../../../constants/nearClient"
import type { SignerCredentials } from "../../../core/formatters"
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { formatTokenValue } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import {
  computeTotalBalanceDifferentDecimals,
  computeTotalDeltaDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import TokenInputCard from "../../deposit/components/DepositForm/TokenInputCard"
import { useOtcTakerConfirmTrade } from "../hooks/useOtcTakerConfirmTrade"
import { useOtcTakerPreparation } from "../hooks/useOtcTakerPreparation"
import type { SignMessage } from "../types/sharedTypes"
import type { TradeTerms } from "../utils/deriveTradeTerms"

export type OtcTakerFormProps = {
  tradeId: string
  makerMultiPayload: MultiPayload
  tradeTerms: TradeTerms
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  signerCredentials: SignerCredentials | null
  signMessage: SignMessage
  protocolFee: number
  onSuccessTrade: (arg: { intentHashes: string[] }) => void
  referral: string | undefined
  renderHostAppLink: RenderHostAppLink
}

export function OtcTakerForm({
  tradeId,
  makerMultiPayload,
  tradeTerms,
  tokenIn,
  tokenOut,
  protocolFee,
  signerCredentials,
  signMessage,
  onSuccessTrade,
  referral,
  renderHostAppLink,
}: OtcTakerFormProps) {
  const signerId =
    signerCredentials != null
      ? authIdentity.authHandleToIntentsUserId(
          signerCredentials.credential,
          signerCredentials.credentialType
        )
      : null
  const isLoggedIn = signerId != null

  const { data: balances } = useQuery({
    queryKey: [
      "deposited_balance_token_in_out",
      signerId,
      Object.keys(tradeTerms.takerTokenDiff),
    ],
    queryFn: async () => {
      assert(signerId != null)

      const balances = await getDepositedBalances(
        signerId,
        [
          ...getUnderlyingBaseTokenInfos(tokenIn).map(
            (token) => token.defuseAssetId
          ),
          ...getUnderlyingBaseTokenInfos(tokenOut).map(
            (token) => token.defuseAssetId
          ),
        ],
        nearClient
      )

      const tokenInBalance = computeTotalBalanceDifferentDecimals(
        tokenIn,
        balances,
        { strict: false }
      )

      const tokenOutBalance = computeTotalBalanceDifferentDecimals(
        tokenOut,
        balances,
        { strict: false }
      )

      return {
        tokenIn: tokenInBalance,
        tokenOut: tokenOutBalance,
      }
    },
    enabled: signerId != null,
  })

  const preparation = useOtcTakerPreparation({
    tokenIn: tokenIn,
    takerTokenDiff: tradeTerms.takerTokenDiff,
    protocolFee,
    takerId: signerId,
  })

  const preparationError = preparation.data?.isErr()
    ? preparation.data.unwrapErr().reason
    : undefined

  const confirmTradeMutation = useOtcTakerConfirmTrade({
    tradeId,
    makerMultiPayload,
    signMessage,
    onSuccessTrade,
    referral,
  })

  const { totalAmountIn, totalAmountOut } = (
    preparation.data?.ok() || None
  ).match({
    some: ({ tokenDelta }) => {
      // This is the actual amount that the taker will send and receive

      const totalAmountIn = negateTokenValue(
        computeTotalDeltaDifferentDecimals(
          getUnderlyingBaseTokenInfos(tokenIn),
          tokenDelta
        )
      )
      const totalAmountOut = computeTotalDeltaDifferentDecimals(
        getUnderlyingBaseTokenInfos(tokenOut),
        tokenDelta
      )
      return { totalAmountIn, totalAmountOut }
    },

    none: () => {
      // This is the fallback amount, since the preparation didn't complete

      let totalAmountIn = computeTotalBalanceDifferentDecimals(
        tokenIn,
        tradeTerms.takerTokenDiff,
        { strict: false }
      )
      assert(totalAmountIn)
      totalAmountIn = negateTokenValue(totalAmountIn)

      const totalAmountOut = computeTotalBalanceDifferentDecimals(
        tokenOut,
        tradeTerms.takerTokenDiff,
        { strict: false }
      )
      assert(totalAmountOut)

      return { totalAmountIn, totalAmountOut }
    },
  })

  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const usdAmountIn = getTokenUsdPrice(
    formatTokenValue(totalAmountIn.amount, totalAmountIn.decimals),
    tokenIn,
    tokensUsdPriceData
  )
  const usdAmountOut = getTokenUsdPrice(
    formatTokenValue(totalAmountOut.amount, totalAmountOut.decimals),
    tokenOut,
    tokensUsdPriceData
  )

  const balanceAmountIn = balances?.tokenIn?.amount ?? 0n
  const balanceAmountOut = balances?.tokenOut?.amount ?? 0n

  const tradeError = confirmTradeMutation.data?.isErr()
    ? confirmTradeMutation.data.unwrapErr().reason
    : undefined

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()

        if (
          !confirmTradeMutation.isPending &&
          signerCredentials != null &&
          preparation.data != null &&
          preparation.data.isOk()
        ) {
          confirmTradeMutation.mutate({
            signerCredentials,
            preparation: preparation.data.unwrap(),
          })
        }
      }}
    >
      <TokenInputCard
        readOnly
        balance={balanceAmountIn}
        decimals={totalAmountIn.decimals}
        symbol={tokenIn.symbol}
        usdAmount={usdAmountIn}
        selectedToken={tokenIn}
        value={formatTokenValue(totalAmountIn.amount, totalAmountIn.decimals)}
      />

      <div className="flex items-center justify-center -my-3.5">
        <div className="size-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400">
          <ArrowDownIcon className="size-5" />
        </div>
      </div>

      <TokenInputCard
        readOnly
        balance={balanceAmountOut}
        decimals={totalAmountOut.decimals}
        symbol={tokenOut.symbol}
        usdAmount={usdAmountOut}
        selectedToken={tokenOut}
        value={formatTokenValue(totalAmountOut.amount, totalAmountOut.decimals)}
      />

      <AuthGate renderHostAppLink={renderHostAppLink} shouldRender={isLoggedIn}>
        <Button
          type="submit"
          size="xl"
          className="mt-6"
          fullWidth
          variant={confirmTradeMutation.isPending ? "secondary" : "primary"}
          loading={confirmTradeMutation.isPending}
          disabled={Boolean(preparationError)}
        >
          {renderButtonText({
            error: preparationError,
            isPending: confirmTradeMutation.isPending,
          })}
        </Button>
      </AuthGate>

      {tradeError && (
        <Alert variant="error" className="mt-6">
          {renderErrorMessage(tradeError)}
        </Alert>
      )}
    </form>
  )
}

const renderButtonText = ({
  isPending,
  error,
}: { isPending: boolean; error: string | undefined }) => {
  if (isPending) {
    return "Confirm in your wallet..."
  }

  if (error === "CANNOT_FILL_ORDER_DUE_TO_INSUFFICIENT_BALANCE") {
    return "It seems sufficient funds for this trade are no longer available. Check with trade creator for more information."
  }

  if (error === "NO_QUOTES") {
    return "No quotes available"
  }

  if (error === "INSUFFICIENT_AMOUNT") {
    return "Amount too low"
  }

  if (error) {
    return "Something went wrong"
  }

  return "Accept offer"
}

const renderErrorMessage = (error: string): string => {
  switch (error) {
    case "ERR_USER_DIDNT_SIGN":
      return "It seems the message wasn’t signed in your wallet. Please try again."
    default:
      return error
  }
}
