import type { ReactNode } from "react"
import { ModalContainer } from "../components/Modal/ModalContainer"
import { ModalStoreProvider } from "./ModalStoreProvider"
import { QueryClientProvider } from "./QueryClientProvider"
import { TokensStoreProvider } from "./TokensStoreProvider"

export const DepositWidgetProvider = ({
  children,
}: { children: ReactNode }) => {
  return (
    <QueryClientProvider>
      <ModalStoreProvider>
        <TokensStoreProvider>
          {children}
          <ModalContainer />
        </TokensStoreProvider>
      </ModalStoreProvider>
    </QueryClientProvider>
  )
}
