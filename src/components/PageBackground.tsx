import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import React from "react"
import { useContext } from "react"

const PageBackground = () => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "dogecoinswap") {
    return (
      <div className="absolute bottom-0 w-full h-full -z-[1]">
        <div className="w-full h-full bg-no-repeat bg-bottom bg-[url('/static/templates/dogecoinswap/bg-light.svg')]" />
      </div>
    )
  }

  return (
    <div className="absolute bottom-0 w-full h-full -z-[1] bg-gray-50 dark:bg-black-900">
      <div className="w-full h-full bg-no-repeat bg-bottom bg-page-light--mobile md:bg-page-light dark:bg-page-dark--mobile dark:md:bg-page-dark" />
    </div>
  )
}

export default PageBackground
