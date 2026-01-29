import { Cog6ToothIcon } from "@heroicons/react/20/solid"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import { useSwapRateData } from "../hooks/useSwapRateData"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

interface SwapSettingsProps {
  tokenOut: TokenInfo
  tokenIn: TokenInfo
}

const SwapSettings = ({ tokenOut, tokenIn }: SwapSettingsProps) => {
  const { slippageBasisPoints } = useSwapRateData()
  const { setModalType } = useModalStore((state) => state)

  const actorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((state) => state)
  const quote = snapshot.context.quote
  const tokenDeltas =
    quote != null && quote.tag === "ok" ? quote.value.tokenDeltas : null
  const swapType = snapshot.context.formValues.swapType

  const handleOpenSlippageSettings = () => {
    setModalType(ModalType.MODAL_SLIPPAGE_SETTINGS, {
      modalType: ModalType.MODAL_SLIPPAGE_SETTINGS,
      actorRef,
      currentSlippage: slippageBasisPoints,
      tokenDeltas,
      tokenOut,
      tokenIn,
      swapType,
    })
  }

  return (
    <button
      type="button"
      onClick={handleOpenSlippageSettings}
      className="size-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors bg-transparent hover:bg-gray-100 rounded-lg"
      aria-label="Open slippage settings"
    >
      <Cog6ToothIcon className="size-5" />
    </button>
  )
}

export default SwapSettings
