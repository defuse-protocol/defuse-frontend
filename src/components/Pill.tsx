import type React from "react"

interface PillProps {
  children: React.ReactNode
}

const Pill: React.FC<PillProps> = ({ children }) => {
  return (
    <span className="rounded-full font-bold border border-gray-8 bg-gray-2 px-2 py-0.5 text-xs text-gray-11 dark:border-gray-7 dark:bg-gray-8 dark:text-gray-12">
      {children}
    </span>
  )
}

export default Pill
