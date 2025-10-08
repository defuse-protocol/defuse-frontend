import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { type PropsWithChildren, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useDebounce } from "../../../../../hooks/useDebounce"
import { reverseAssetNetworkAdapter } from "../../../utils/adapters"
import type { DepositFormValues } from "./DepositForm"
import { DepositUIMachineContext } from "./DepositUIMachineProvider"

type DepositUIMachineFormSyncProviderProps = PropsWithChildren<{
  userAddress?: string
  userWalletAddress: string | null
  userChainType?: AuthMethod
}>

export function DepositUIMachineFormSyncProvider({
  children,
  userAddress,
  userWalletAddress,
  userChainType,
}: DepositUIMachineFormSyncProviderProps) {
  const { watch } = useFormContext<DepositFormValues>()
  const actorRef = DepositUIMachineContext.useActorRef()

  const amountValue = watch("amount")
  const debouncedAmount = useDebounce(amountValue, 500)

  useEffect(() => {
    const sub = watch(async (value, { name }) => {
      if (name === "network") {
        const networkValue = value[name]
        if (networkValue === undefined) {
          return
        }
        const networkFromMachine = actorRef
          .getSnapshot()
          .context.depositFormRef.getSnapshot().context.blockchain
        const networkFromForm = networkValue
          ? reverseAssetNetworkAdapter[networkValue]
          : null
        // This is a hack to prevent double updates of the network triggered by form
        if (networkFromMachine === networkFromForm) {
          return
        }
        actorRef.send({
          type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN",
          params: { network: networkValue },
        })
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [watch, actorRef])

  // Debounce amount input updates to reduce network load and RPC calls
  useEffect(() => {
    if (debouncedAmount === undefined) {
      return
    }
    actorRef.send({
      type: "DEPOSIT_FORM.UPDATE_AMOUNT",
      params: { amount: debouncedAmount },
    })
  }, [debouncedAmount, actorRef])

  useEffect(() => {
    if (!userAddress || userChainType == null) {
      actorRef.send({
        type: "LOGOUT",
      })
    } else {
      actorRef.send({
        type: "LOGIN",
        params: { userAddress, userWalletAddress, userChainType },
      })
    }
  }, [actorRef, userAddress, userWalletAddress, userChainType])

  return <>{children}</>
}
