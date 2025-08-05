import {
  QueryClient,
  QueryClientProvider as RCProvider,
} from "@tanstack/react-query"
import type { PropsWithChildren } from "react"

// todo: accept queryClient instance from user
export const queryClient = new QueryClient()

export const QueryClientProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <RCProvider client={queryClient}>{children}</RCProvider>
}
