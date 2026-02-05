"use client"

import { ShieldIcon } from "@phosphor-icons/react"
import { Spinner, Switch, Text, Tooltip } from "@radix-ui/themes"
import { usePrivateModeAuth } from "@src/hooks/usePrivateModeAuth"

export function PrivateModeToggle() {
  const {
    isPrivateModeEnabled,
    isAuthenticating,
    authError,
    isConnected,
    togglePrivateMode,
  } = usePrivateModeAuth()

  const isDisabled = isAuthenticating || !isConnected

  const toggle = (
    <div className="flex items-center gap-2">
      {isAuthenticating ? (
        <Spinner size="1" />
      ) : (
        <ShieldIcon
          className="w-4 h-4"
          weight={isPrivateModeEnabled ? "fill" : "bold"}
        />
      )}
      <Text size="2" weight="medium">
        Private
      </Text>
      <Switch
        size="1"
        onCheckedChange={() => togglePrivateMode()}
        checked={isPrivateModeEnabled}
        disabled={isDisabled}
      />
    </div>
  )

  // Show tooltip with error or hint when disabled
  if (authError) {
    return (
      <Tooltip content={authError}>
        <div>{toggle}</div>
      </Tooltip>
    )
  }

  if (!isConnected) {
    return (
      <Tooltip content="Connect wallet to enable">
        <div>{toggle}</div>
      </Tooltip>
    )
  }

  return toggle
}
