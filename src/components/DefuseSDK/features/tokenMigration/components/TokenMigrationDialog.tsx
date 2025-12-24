import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Button, Callout, Dialog, Spinner } from "@radix-ui/themes"
import { useActor } from "@xstate/react"
import { CopyButton } from "../../../components/IntentCard/CopyButton"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
import { blockExplorerTxLinkFactory } from "../../../utils/chainTxExplorer"
import type { SignMessage } from "../../otcDesk/types/sharedTypes"
import { tokenMigrationMachine } from "../machines/tokenMigrationMachine"

export function TokenMigrationDialog({
  userAddress,
  userChainType,
  signMessage,
  onExit,
}: {
  /** User's wallet address */
  userAddress: string
  userChainType: AuthMethod

  signMessage: SignMessage
  onExit: () => void
}) {
  const userId = authIdentity.authHandleToIntentsUserId(
    userAddress,
    userChainType
  )

  const [state, send] = useActor(tokenMigrationMachine, {
    input: {
      userId,
      signerCredentials: {
        credential: userAddress,
        credentialType: userChainType,
      },
      signMessage,
    },
  })

  return (
    <BaseModalDialog
      open={state.matches("migrating")}
      onClose={() => send({ type: "CANCEL" })}
      onCloseAnimationEnd={onExit}
      title="Update tokens?"
    >
      {!state.matches({ migrating: "settled" }) ? (
        <>
          <Dialog.Description className="text-sm font-medium text-gray-11">
            Some of your tokens are no longer supported. To continue using them,
            you’ll need to update to the latest version. This will require
            signing a message in your wallet.
          </Dialog.Description>

          {/* Error Section */}
          {state.context.error != null && (
            <Callout.Root size="1" color="red" className="mt-4">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{state.context.error}</Callout.Text>
            </Callout.Root>
          )}

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
            <Button
              type="button"
              size="4"
              variant="outline"
              color="gray"
              className="md:flex-1 font-bold"
              onClick={() => send({ type: "CANCEL" })}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="4"
              variant={state.tags.has("busy") ? "soft" : "solid"}
              color={state.tags.has("busy") ? "gray" : undefined}
              className="md:flex-1 font-bold"
              onClick={() => send({ type: "PROCEED" })}
            >
              <Spinner loading={state.tags.has("busy")} />
              {state.tags.has("busy") ? "Updating..." : "Update"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Dialog.Title className="text-2xl font-black text-gray-12 mb-2">
            Tokens migrated!
          </Dialog.Title>

          <Dialog.Description className="text-sm font-medium text-gray-11">
            Your tokens are migrated! You can keep using the app.
          </Dialog.Description>

          {state.context.intentStatus != null &&
            renderTxDetails({
              intentHash: state.context.intentStatus.intentHash,
              txHash: state.context.intentStatus.txHash,
            })}

          <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
            <Button
              type="button"
              size="4"
              className="md:flex-1 font-bold"
              onClick={() => send({ type: "OK" })}
            >
              OK
            </Button>
          </div>
        </>
      )}
    </BaseModalDialog>
  )
}

function renderTxDetails({
  intentHash,
  txHash,
}: { intentHash: string; txHash: string | null }) {
  const txUrl =
    txHash != null ? blockExplorerTxLinkFactory("near", txHash) : null

  return (
    <div className="flex flex-col gap-3.5 px-4 text-xs mt-4">
      <div className="flex justify-between items-center">
        <div className="text-gray-11 font-medium">Intents</div>
        <div className="flex gap-2.5">
          <div className="flex flex-row items-center gap-1 text-gray-12 font-medium">
            <span className="text-gray-12 font-medium">
              {truncateHash(intentHash)}
            </span>
            <CopyButton text={intentHash} ariaLabel="Copy intent hash" />
          </div>
        </div>
      </div>
      {txUrl != null && (
        <div className="flex justify-between items-center">
          <div className="text-gray-11 font-medium">Transaction hash</div>
          {txHash && (
            <div className="flex flex-row items-center gap-1 text-blue-c11 font-medium">
              <a href={txUrl} rel="noopener noreferrer" target="_blank">
                {truncateHash(txHash)}
              </a>
              <CopyButton text={txHash} ariaLabel="Copy intent hash" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
