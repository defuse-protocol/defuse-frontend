import type { ReactNode } from "react"

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-gray-800 p-2 flex">
    <main className="flex flex-col bg-gray-25 rounded-3xl flex-1">
      {children}
    </main>
  </div>
)

export default AuthLayout
