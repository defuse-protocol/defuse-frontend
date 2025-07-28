import { ArrowDown } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { None } from "@thames/monads"
import clsx from "clsx"
import { AuthGate } from "../../../components/AuthGate"
import { BlockMultiBalances } from "../../../components/Block/BlockMultiBalances"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { nearClient } from "../../../constants/nearClient"
import type { SignerCredentials } from "../../../core/formatters"
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { assert } from "../../../utils/assert"
import { authHandleToIntentsUserId } from "../../../utils/authIdentity"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import {
  computeTotalBalanceDifferentDecimals,
  computeTotalDeltaDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import { TokenAmountInputCard } from "../../deposit/components/DepositForm/TokenAmountInputCard"
import { useOtcTakerConfirmTrade } from "../hooks/useOtcTakerConfirmTrade"
import { useOtcTakerPreparation } from "../hooks/useOtcTakerPreparation"
import type { SignMessage } from "../types/sharedTypes"
import type { TradeTerms } from "../utils/deriveTradeTerms"

export type OtcTakerFormProps = {
  tradeId: string
  makerMultiPayload: MultiPayload
  tradeTerms: TradeTerms
  tokenIn: BaseTokenInfo | UnifiedTokenInfo
  tokenOut: BaseTokenInfo | UnifiedTokenInfo
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
      ? authHandleToIntentsUserId(
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

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col items-start text-center mb-5">
        <div className="text-2xl font-black text-gray-12 mb-1.5">
          Complete swap
        </div>
        <div className="text-sm font-medium text-gray-11">
          Pay the specified amount to finalize the transaction.
        </div>
      </div>

      {confirmTradeMutation.data?.match({
        ok: () => <div>Swapped!</div>,
        err: (err) => <div className="text-red-700">{err.reason}</div>,
      })}

      <div className="flex flex-col items-center">
        <div className="flex flex-col gap-3">
          <TokenAmountInputCard
            variant="2"
            labelSlot={
              <label
                htmlFor="otc-maker-amount-out"
                className="font-bold text-label text-sm"
              >
                Pay
              </label>
            }
            inputSlot={
              <TokenAmountInputCard.Input
                readOnly
                name="amount"
                value={formatTokenValue(
                  totalAmountIn.amount,
                  totalAmountIn.decimals
                )}
              />
            }
            tokenSlot={<TokenAmountInputCard.DisplayToken token={tokenIn} />}
            balanceSlot={
              <BlockMultiBalances
                balance={balanceAmountIn}
                decimals={balances?.tokenIn?.decimals ?? 0}
                className={clsx(
                  "!static",
                  balances?.tokenIn == null && "invisible"
                )}
                maxButtonSlot={
                  <BlockMultiBalances.DisplayMaxButton
                    balance={balanceAmountIn}
                    disabled
                  />
                }
                halfButtonSlot={
                  <BlockMultiBalances.DisplayHalfButton
                    balance={balanceAmountIn}
                    disabled
                  />
                }
              />
            }
            priceSlot={
              <TokenAmountInputCard.DisplayPrice>
                {usdAmountIn !== null && usdAmountIn > 0
                  ? formatUsdAmount(usdAmountIn)
                  : null}
              </TokenAmountInputCard.DisplayPrice>
            }
          />
        </div>

        <div className="size-10 -my-3.5 rounded-[10px] bg-accent-1 flex items-center justify-center z-10">
          <ArrowDown className="size-5" weight="bold" />
        </div>

        <div className="flex flex-col gap-3">
          <TokenAmountInputCard
            variant="2"
            labelSlot={
              <label
                htmlFor="otc-maker-amount-out"
                className="font-bold text-label text-sm"
              >
                Receive
              </label>
            }
            inputSlot={
              <TokenAmountInputCard.Input
                readOnly
                name="amount"
                value={formatTokenValue(
                  totalAmountOut.amount,
                  totalAmountOut.decimals
                )}
              />
            }
            tokenSlot={<TokenAmountInputCard.DisplayToken token={tokenOut} />}
            balanceSlot={
              <BlockMultiBalances
                balance={balanceAmountOut}
                decimals={balances?.tokenOut?.decimals ?? 0}
                className={clsx(
                  "!static",
                  balances?.tokenOut == null && "invisible"
                )}
                maxButtonSlot={
                  <BlockMultiBalances.DisplayMaxButton
                    balance={balanceAmountOut}
                    disabled
                  />
                }
                halfButtonSlot={
                  <BlockMultiBalances.DisplayHalfButton
                    balance={balanceAmountOut}
                    disabled
                  />
                }
              />
            }
            priceSlot={
              <TokenAmountInputCard.DisplayPrice>
                {usdAmountOut !== null && usdAmountOut > 0
                  ? formatUsdAmount(usdAmountOut)
                  : null}
              </TokenAmountInputCard.DisplayPrice>
            }
          />
        </div>
      </div>

      <AuthGate
        renderHostAppLink={renderHostAppLink}
        shouldRender={isLoggedIn}
        className="mt-5"
      >
        <ButtonCustom
          type="button"
          size="lg"
          className="mt-5"
          variant={confirmTradeMutation.isPending ? "secondary" : "primary"}
          onClick={() => {
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
          isLoading={confirmTradeMutation.isPending}
        >
          {confirmTradeMutation.isPending
            ? "Confirm in your wallet..."
            : "Confirm swap"}
        </ButtonCustom>
      </AuthGate>
    </div>
  )
}
