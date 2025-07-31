import { Button, Flex, Text } from "@radix-ui/themes"
import { useModalStore } from "../../providers/ModalStoreProvider"
import { ModalDialog } from "./ModalDialog"

export type ModalConfirmAddPubkeyPayload = {
  accountId: string
  onConfirm: () => void
  onAbort: () => void
}

export const ModalConfirmAddPubkey = () => {
  const { onCloseModal, payload } = useModalStore((state) => state)
  const { accountId, onConfirm, onAbort } =
    payload as ModalConfirmAddPubkeyPayload

  return (
    <ModalDialog
      onClose={() => {
        onAbort()
      }}
    >
      <Flex direction="column" gap="4">
        <Flex>
          <Text size="8">Confirm Your Account</Text>
        </Flex>

        <Text>
          {/* biome-ignore lint/nursery/useConsistentCurlyBraces: space is needed here */}
          To verify your account (NEAR ID:{" "}
          <Text weight="bold">{accountId}</Text>), please send a one-time
          transaction.
        </Text>

        <Flex gap="3" justify="end">
          <Button
            color="gray"
            variant="outline"
            onClick={() => {
              // `onCloseModal` does not call `onClose` prop passed to `ModalDialog`, so we need to call abort manually
              onAbort()
              onCloseModal()
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              onConfirm()
            }}
          >
            Confirm Account
          </Button>
        </Flex>
      </Flex>
    </ModalDialog>
  )
}
