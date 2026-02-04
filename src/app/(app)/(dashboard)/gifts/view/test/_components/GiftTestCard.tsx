"use client"

import Button from "@src/components/Button"

export function GiftTestCard({ onClick }: { onClick?: () => void }) {
  return (
    <div>
      <h1>You’ve received a gift!</h1>
      <Button onClick={onClick}>Tap to reveal</Button>
    </div>
  )
}
