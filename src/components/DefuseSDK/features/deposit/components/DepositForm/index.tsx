import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { ChevronLeftIcon } from "@heroicons/react/16/solid"
import { InformationCircleIcon } from "@heroicons/react/20/solid"
import { ModalSelectNetwork } from "@src/components/DefuseSDK/components/Network/ModalSelectNetwork"
import { usePreparedNetworkLists } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "@src/components/DefuseSDK/utils/adapters"
import {
  availableChainsForToken,
  getDefaultBlockchainOptionValue,
} from "@src/components/DefuseSDK/utils/blockchain"
import {
  getDerivedToken,
  isMinAmountNotRequired,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import TokenIconPlaceholder from "@src/components/TokenIconPlaceholder"
import { useSelector } from "@xstate/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import { AuthGate } from "../../../../components/AuthGate"
import { Form } from "../../../../components/Form"
import type { ModalSelectAssetsPayload } from "../../../../components/Modal/ModalSelectAssets"
import { SelectTriggerLike } from "../../../../components/Select/SelectTriggerLike"
import { getBlockchainsOptions } from "../../../../constants/blockchains"
import { useModalStore } from "../../../../providers/ModalStoreProvider"
import { getAvailableDepositRoutes } from "../../../../services/depositService"
import { ModalType } from "../../../../stores/modalStore"
import type { SupportedChainName } from "../../../../types/base"
import type { RenderHostAppLink } from "../../../../types/hostAppLink"
import { getPOABridgeInfo } from "../../../machines/poaBridgeInfoActor"
import { DepositUIMachineContext } from "../DepositUIMachineProvider"
import { ActiveDeposit } from "./ActiveDeposit"
import { DepositMethodSelector } from "./DepositMethodSelector"
import { PassiveDeposit } from "./PassiveDeposit"

export type DepositFormValues = {
  network: BlockchainEnum | null
  amount: string
  token: TokenInfo | null
  userAddress: string | null
  rpcUrl: string | undefined
  renderHostAppLink: RenderHostAppLink
}

export const DepositForm = ({
  chainType,
  renderHostAppLink,
}: {
  chainType?: AuthMethod
  renderHostAppLink: RenderHostAppLink
}) => {
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const { handleSubmit, register, control, setValue, watch } =
    useFormContext<DepositFormValues>()

  const depositUIActorRef = DepositUIMachineContext.useActorRef()
  const snapshot = DepositUIMachineContext.useSelector((snapshot) => snapshot)
  const preparationOutput = snapshot.context.preparationOutput

  const {
    token,
    derivedToken,
    tokenDeployment,
    network,
    userAddress,
    poaBridgeInfoRef,
  } = DepositUIMachineContext.useSelector((snapshot) => {
    const { userAddress, poaBridgeInfoRef } = snapshot.context
    const { token, derivedToken, tokenDeployment, blockchain } =
      snapshot.context.depositFormRef.getSnapshot().context

    return {
      token,
      derivedToken,
      tokenDeployment,
      network: blockchain,
      userAddress,
      poaBridgeInfoRef,
    }
  })

  const isOutputOk = preparationOutput?.tag === "ok"
  const depositAddress = isOutputOk
    ? preparationOutput.value.generateDepositAddress
    : null
  const memo = isOutputOk
    ? "memo" in preparationOutput.value
      ? preparationOutput.value.memo
      : null
    : null

  const { setModalType, payload, onCloseModal } = useModalStore(
    (state) => state
  )

  const onCloseNetworkModal = () => setIsNetworkModalOpen(false)

  const onChangeNetwork = (network: SupportedChainName) => {
    setValue("network", assetNetworkAdapter[network])
    onCloseNetworkModal()
  }

  const openModalSelectAssets = (
    fieldName: string,
    selectToken: TokenInfo | undefined
  ) => {
    setModalType(ModalType.MODAL_SELECT_ASSETS, {
      fieldName,
      [fieldName]: selectToken,
    })
  }

  useEffect(() => {
    if (
      (payload as ModalSelectAssetsPayload)?.modalType !==
      ModalType.MODAL_SELECT_ASSETS
    ) {
      return
    }
    const { modalType, fieldName, token } = payload as ModalSelectAssetsPayload
    if (modalType === ModalType.MODAL_SELECT_ASSETS && fieldName && token) {
      depositUIActorRef.send({
        type: "DEPOSIT_FORM.UPDATE_TOKEN",
        params: { token },
      })
      setValue("token", token)
      // We have to clean up network because it could be not a valid value for the previous token
      setValue("network", null)
      setValue("amount", "")
      onCloseModal(undefined)
    }
  }, [payload, onCloseModal, depositUIActorRef, setValue])

  const onSubmit = () => {
    depositUIActorRef.send({
      type: "SUBMIT",
    })
  }

  const formNetwork = watch("network")
  useEffect(() => {
    const networkDefaultOption = token
      ? getDefaultBlockchainOptionValue(token)
      : null
    if (formNetwork === null) {
      setValue("network", networkDefaultOption)
    }
  }, [formNetwork, token, setValue])

  const minDepositAmount = useSelector(poaBridgeInfoRef, (state) => {
    if (
      chainType != null &&
      network != null &&
      isMinAmountNotRequired(chainType, network)
    ) {
      return null
    }

    const tokenOut =
      token && formNetwork
        ? getDerivedToken(token, reverseAssetNetworkAdapter[formNetwork])
        : null
    if (tokenOut == null) {
      return null
    }

    const bridgedTokenInfo = getPOABridgeInfo(state, tokenOut.defuseAssetId)
    return bridgedTokenInfo == null ? null : bridgedTokenInfo.minDeposit
  })

  const availableDepositRoutes =
    chainType &&
    network &&
    getAvailableDepositRoutes(chainType, assetNetworkAdapter[network])
  const isActiveDeposit = availableDepositRoutes?.activeDeposit
  const isPassiveDeposit = availableDepositRoutes?.passiveDeposit

  const [preferredDepositOption, setPreferredDepositOption] = useState<
    "active" | "passive"
  >("active")

  const currentDepositOption =
    preferredDepositOption === "active" && isActiveDeposit
      ? "active"
      : isPassiveDeposit
        ? "passive"
        : isActiveDeposit
          ? "active"
          : null

  const chainOptions = token != null ? availableChainsForToken(token) : {}
  const { availableNetworks, disabledNetworks } = usePreparedNetworkLists({
    networks: getBlockchainsOptions(),
    token,
  })

  const networkEnum = assetNetworkAdapter[network as SupportedChainName]
  const singleNetwork = Object.keys(chainOptions).length === 1
  return (
    <>
      <Link
        href="/deposit"
        className="inline-flex items-center gap-2 text-gray-500 text-sm/6 hover:text-gray-900"
      >
        <ChevronLeftIcon className="size-4" />
        Back
      </Link>

      <h1 className="text-gray-900 text-xl font-semibold tracking-tight mt-4">
        Deposit crypto
      </h1>

      <Form<DepositFormValues>
        handleSubmit={handleSubmit(onSubmit)}
        register={register}
        className="mt-6"
      >
        <div className="flex flex-col gap-2">
          <SelectTriggerLike
            icon={
              token ? (
                <AssetComboIcon icon={token?.icon} />
              ) : (
                <TokenIconPlaceholder className="size-10" />
              )
            }
            label={token ? "Token" : "Select token"}
            value={token?.name}
            onClick={() => openModalSelectAssets("token", token ?? undefined)}
            data-testid="select-deposit-asset"
          />

          {token && (
            <Controller
              name="network"
              control={control}
              render={({ field }) => (
                <>
                  <SelectTriggerLike
                    label={
                      chainOptions[networkEnum]?.label
                        ? "Network"
                        : "Select network"
                    }
                    value={chainOptions[networkEnum]?.label}
                    icon={
                      chainOptions[networkEnum]?.icon ?? (
                        <TokenIconPlaceholder className="size-10" />
                      )
                    }
                    onClick={() => setIsNetworkModalOpen(true)}
                    disabled={
                      chainOptions &&
                      Object.keys(chainOptions).length === 1 &&
                      field.value === Object.values(chainOptions)[0]?.value
                    }
                    hint={singleNetwork ? "This network only" : undefined}
                    data-testid="select-network-trigger"
                  />

                  <ModalSelectNetwork
                    selectNetwork={onChangeNetwork}
                    selectedNetwork={network}
                    isOpen={isNetworkModalOpen}
                    onClose={onCloseNetworkModal}
                    availableNetworks={availableNetworks}
                    disabledNetworks={disabledNetworks}
                  />
                </>
              )}
            />
          )}
        </div>

        {currentDepositOption != null && (
          <>
            {isActiveDeposit && isPassiveDeposit && (
              <DepositMethodSelector
                selectedDepositOption={currentDepositOption}
                onSelectDepositOption={setPreferredDepositOption}
              />
            )}

            {currentDepositOption === "passive" &&
              network != null &&
              derivedToken != null &&
              tokenDeployment != null && (
                <PassiveDeposit
                  depositAddress={depositAddress}
                  minDepositAmount={minDepositAmount}
                  token={derivedToken}
                  tokenDeployment={tokenDeployment}
                  memo={memo}
                  depositWarning={preparationOutput}
                  network={network}
                />
              )}

            {currentDepositOption === "active" &&
              network != null &&
              derivedToken != null &&
              tokenDeployment != null && (
                <ActiveDeposit
                  network={assetNetworkAdapter[network]}
                  token={derivedToken}
                  tokenDeployment={tokenDeployment}
                  minDepositAmount={minDepositAmount}
                />
              )}
          </>
        )}

        <AuthGate
          renderHostAppLink={renderHostAppLink}
          shouldRender={!!userAddress}
        />

        {userAddress && network && !isActiveDeposit && !isPassiveDeposit && (
          <div className="mt-6 bg-blue-50 pl-3 pr-6 py-3 rounded-2xl flex items-start gap-3">
            <InformationCircleIcon
              className="size-5 shrink-0 text-blue-400"
              aria-hidden
            />
            <div className="text-blue-700 text-sm/5 font-semibold">
              Deposit is not supported for this wallet connection, please try
              another token or network
            </div>
          </div>
        )}
      </Form>
    </>
  )
}
