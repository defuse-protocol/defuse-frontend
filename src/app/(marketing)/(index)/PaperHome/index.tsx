import type { PropsWithChildren } from "react"

const PaperHome = ({ children }: PropsWithChildren) => {
  return (
    <div className="w-full px-5 bg-gray shadow-home-paper z-10 rounded-t-2xl">
      <div className="w-full mx-auto max-w-5xl">{children}</div>
    </div>
  )
}

export default PaperHome
