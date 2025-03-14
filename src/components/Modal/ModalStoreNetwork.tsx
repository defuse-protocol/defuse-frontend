"use client"

import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Text, Tooltip } from "@radix-ui/themes"
import Image from "next/image"
import React, { useState } from "react"

import Button from "@src/components/Button/Button"
import { handleValidateAccount } from "@src/components/Modal/ModalConnectNetworks"
import ModalDialog from "@src/components/Modal/ModalDialog"
import Network from "@src/components/Network/Network"
import { useModalStore } from "@src/providers/ModalStoreProvider"
import { useTokensStore } from "@src/providers/TokensStoreProvider"
import { networkLabelAdapter } from "@src/utils/network"

export type ModalStoreNetworkPayload = {
  storeKey: string
  defuse_asset_id: string
  chainIcon: string
  chainName: string
}

const ModalStoreNetwork = () => {
  const [account, setAccount] = useState("")
  const [errorAccount, setErrorAccount] = useState("")
  const { onCloseModal, payload } = useModalStore((state) => state)
  const [convertPayload] = useState<ModalStoreNetworkPayload>(
    payload as ModalStoreNetworkPayload
  )
  const { triggerTokenUpdate } = useTokensStore((state) => state)

  const handleConnect = () => {
    localStorage.setItem(convertPayload.storeKey, account)
    onCloseModal()
    triggerTokenUpdate()
  }

  return (
    <ModalDialog>
      <div className="flex flex-col min-h-[256px] max-h-[680px] h-full p-5">
        <div className="flex justify-between items-center mb-[44px]">
          <div className="relative w-full shrink text-center text-black-400">
            <Text size="4" weight="bold" className="dark:text-gray-500">
              Connect you wallet
            </Text>
            <div className="w-full absolute top-[30px] left-[50%] -translate-x-2/4 flex justify-center items-center gap-1 text-gray-600">
              <Text size="2" weight="medium">
                Please connect your wallet on{" "}
                {networkLabelAdapter(convertPayload.defuse_asset_id)}
              </Text>
              <Tooltip content="Please specify the wallet address on the specified network">
                <InfoCircledIcon />
              </Tooltip>
            </div>
          </div>
          <button type={"button"} className="shrink-0" onClick={onCloseModal}>
            <Image
              src="/static/icons/close.svg"
              alt="Close Icon"
              width={14}
              height={14}
            />
          </button>
        </div>
        <div className="w-full flex flex-col mb-6 relative">
          <div className="relative flex-1 p-[18px] border-[1px] border-gray-100 rounded-xl bg-gray dark:bg-black-900 dark:border-black-950">
            <Network
              chainIcon={convertPayload.chainIcon}
              chainName={convertPayload.chainName}
              account={account}
              onChange={(account) => setAccount(account)}
              onBlur={(account) =>
                handleValidateAccount(
                  account,
                  setErrorAccount,
                  convertPayload.defuse_asset_id
                )
              }
            />
            {errorAccount && (
              <div className="absolute bottom-2 left-[75px] flex justify-center items-center gap-2">
                <span className="text-sm text-red-400">{errorAccount}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="lg"
          fullWidth
          onClick={handleConnect}
          disabled={!account || !!errorAccount}
        >
          Connect
        </Button>
      </div>
    </ModalDialog>
  )
}

export default ModalStoreNetwork
