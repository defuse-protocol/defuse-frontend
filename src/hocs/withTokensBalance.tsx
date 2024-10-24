"use client"

import React, { PropsWithChildren, useEffect } from "react"

import { useGetTokensBalance } from "@src/hooks/useGetTokensBalance"
import { useCombinedTokensListAdapter } from "@src/hooks/useTokensListAdapter"
import { useTokensStore } from "@src/providers/TokensStoreProvider"

export function withTokensBalance<T extends React.ComponentType>(
  WrappedComponent: T
): React.FC<PropsWithChildren & React.ComponentProps<T>> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component"

  const ComponentWithTokensBalance: React.FC<PropsWithChildren> = ({
    children,
    ...rest
  }) => {
    const { data: dataTokenList } = useCombinedTokensListAdapter()
    const { data: dataTokensBalance } = useGetTokensBalance(dataTokenList)
    const { updateTokens } = useTokensStore((state) => state)

    useEffect(() => {
      if (dataTokensBalance) {
        updateTokens(dataTokensBalance)
      }
    }, [dataTokensBalance])

    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      <WrappedComponent {...rest}>{children}</WrappedComponent>
    )
  }

  ComponentWithTokensBalance.displayName = `WithTokensBalance(${displayName})`

  return ComponentWithTokensBalance as React.FC<
    PropsWithChildren & React.ComponentProps<T>
  >
}
