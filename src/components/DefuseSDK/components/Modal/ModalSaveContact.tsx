import type {
  AuthMethod,
  BlockchainEnum,
} from "@defuse-protocol/internal-utils"
import { UserCircleIcon } from "@heroicons/react/20/solid"
import {
  type Contact,
  createContact,
} from "@src/app/(app)/(auth)/contacts/actions"
import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { WalletIcon } from "@src/icons"
import { useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { chainIcons } from "../../constants/blockchains"
import {
  chainNameToNetworkName,
  midTruncate,
} from "../../features/withdraw/components/WithdrawForm/utils"
import type { SupportedChainName } from "../../types/base"
import { assetNetworkAdapter } from "../../utils/adapters"
import { NetworkIcon } from "../Network/NetworkIcon"
import { BaseModalDialog } from "./ModalDialog"

type FormData = {
  name: string
}

type ModalSaveContactProps = {
  open: boolean
  /** The address to save (pre-filled, read-only) */
  address: string
  /** The network for the contact (pre-filled, read-only) */
  network: SupportedChainName
  onClose: () => void
  /** Called with the newly created contact on success */
  onSuccess: (contact: Contact) => void
}

/**
 * Minimal modal for saving an address as a contact.
 * Address and network are pre-filled and displayed read-only.
 * User only needs to enter a name.
 */
const ModalSaveContact = ({
  open,
  address,
  network,
  onClose,
  onSuccess,
}: ModalSaveContactProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { state } = useConnectWallet()
  const userAddress = state.address
  const chainType = state.chainType as AuthMethod | undefined
  const queryClient = useQueryClient()

  const blockchain = assetNetworkAdapter[network] as BlockchainEnum
  const chainIcon = chainIcons[network]
  const chainName = chainNameToNetworkName(network)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { name: "" },
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)

    try {
      const result = await createContact({
        name: data.name,
        address,
        blockchain,
        userAddress,
        chainType,
      })

      if (!result.ok) {
        setSubmitError(result.error)
        return
      }

      // Invalidate contacts query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["contacts"] })

      // Convert ContactEntity to Contact type (blockchain as BlockchainEnum)
      const contact: Contact = {
        id: result.value.id,
        contactId: result.value.contactId,
        accountId: result.value.accountId,
        address: result.value.address,
        name: result.value.name,
        blockchain, // Use the BlockchainEnum we already have
      }

      onSuccess(contact)
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      )
    }
  }

  return (
    <BaseModalDialog
      title="Save as contact"
      open={open}
      onClose={onClose}
      onCloseAnimationEnd={() => {
        reset()
        setSubmitError(null)
      }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-3"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      >
        {/* Hidden honeypot fields to trick autofill */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="space-y-2">
          {/* Name input (editable) */}
          <div>
            <label
              className={clsx(
                "flex items-center gap-3 rounded-3xl bg-white p-3 cursor-text outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
                errors.name
                  ? "outline-red-500 focus-within:outline-red-500"
                  : "outline-gray-200 focus-within:outline-gray-900"
              )}
            >
              <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
                <UserCircleIcon className="size-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <span className="sr-only">Name</span>
                <input
                  id="save-contact-name"
                  type="text"
                  placeholder="Enter name"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="block w-full text-gray-900 font-semibold placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
                  {...register("name", {
                    required: "Enter a name for the contact.",
                  })}
                />
              </div>
            </label>
            {errors.name && (
              <ErrorMessage className="mt-1 mb-5">
                {errors.name.message}
              </ErrorMessage>
            )}
          </div>

          {/* Address display (read-only) */}
          <div className="flex items-center gap-3 rounded-3xl bg-gray-50 p-3">
            <div className="bg-gray-100 rounded-full size-10 shrink-0 flex items-center justify-center">
              <WalletIcon className="size-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm/none font-medium text-gray-500">
                Address
              </span>
              <span className="block text-base/none font-semibold text-gray-700 truncate mt-1">
                {midTruncate(address, 20)}
              </span>
            </div>
          </div>

          {/* Network display (read-only) */}
          <div className="flex items-center gap-3 rounded-3xl bg-gray-50 p-3">
            <div className="size-10 shrink-0">
              <NetworkIcon chainIcon={chainIcon} sizeClassName="size-10" />
            </div>
            <div className="flex-1">
              <span className="block text-sm/none font-medium text-gray-500">
                Network
              </span>
              <span className="block text-base/none font-semibold text-gray-700 capitalize mt-1">
                {chainName}
              </span>
            </div>
          </div>
        </div>

        {submitError && (
          <ErrorMessage className="mt-3">{submitError}</ErrorMessage>
        )}

        <Button
          type="submit"
          variant="primary"
          size="xl"
          fullWidth
          className="mt-5"
          loading={isSubmitting}
        >
          Save contact
        </Button>
      </form>
    </BaseModalDialog>
  )
}

export default ModalSaveContact
