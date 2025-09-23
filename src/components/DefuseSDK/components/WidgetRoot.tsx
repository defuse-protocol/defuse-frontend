import type { ReactNode } from "react"

export interface WidgetRootProps {
  children: ReactNode
}

export function WidgetRoot(props: WidgetRootProps) {
  return <>{props.children}</>
}
