import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Callout } from "@radix-ui/themes"

type ErrorReasonProps = {
  reason: string
}

export function ErrorReason({ reason }: ErrorReasonProps) {
  return (
    <Callout.Root size="1" color="red" data-testid="error-reason">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>{renderErrorMessages(reason)}</Callout.Text>
    </Callout.Root>
  )
}

function renderErrorMessages(reason: string): string {
  switch (reason) {
    case "ERR_STORE_FAILED":
      return "Cannot store OTC trade"
    case "ERR_USER_DIDNT_SIGN":
      return "It seems the message wasn’t signed in your wallet. Please try again."
    default:
      return reason
  }
}
