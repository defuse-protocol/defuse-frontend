import type { ModalType } from "@src/stores/modalStore"
import type {
  NetworkToken,
  NetworkTokenWithSwapRoute,
} from "@src/types/interfaces"

/** @deprecated */
export type ModalSelectAssetsPayload = {
  modalType?: ModalType.MODAL_SELECT_ASSETS
  token?: NetworkToken
  fieldName?: string
}
/** @deprecated */
export interface TokenListWithNotSelectableToken
  extends NetworkTokenWithSwapRoute {
  isNotSelectable?: boolean
}
