import { PlusIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import EmptyState from "@src/components/EmptyState"

export function GiftHistoryEmpty() {
  return (
    <EmptyState className="mt-6">
      <EmptyState.Title>No gifts yet</EmptyState.Title>
      <EmptyState.Description>
        Create a gift and send it to your friends
      </EmptyState.Description>
      <Button href="/gifts/new" size="xl" className="mt-4">
        <PlusIcon className="size-5 shrink-0" />
        Create a gift
      </Button>
    </EmptyState>
  )
}

export function GiftHistoryNotLoggedIn() {
  return (
    <EmptyState className="mt-6">
      <EmptyState.Title>Connect your wallet</EmptyState.Title>
      <EmptyState.Description>
        Connect your wallet to create and manage gift links
      </EmptyState.Description>
    </EmptyState>
  )
}
