import type { ReactNode } from "react"
import "../styles/main.css"

export interface WidgetRootProps {
  children: ReactNode
}

export function WidgetRoot(props: WidgetRootProps) {
  return <>{props.children}</>
}
