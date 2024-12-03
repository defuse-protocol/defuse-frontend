import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import Image from "next/image"
import Link from "next/link"
import { type PropsWithChildren, useContext } from "react"

interface Props extends PropsWithChildren {
  title?: string
  description?: string
}

const Paper = ({ children, title, description }: Props) => {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)

  if (whitelabelTemplate === "turboswap") {
    return (
      <div className="flex flex-col flex-1 justify-start items-center sm:mt-[5.5rem] md:mt-0">
        <div className="w-full md:w-auto md:min-w-[512px]">
          <div className="flex flex-col mb-8 text-center md:text-left">
            {title && <h1 className="mb-3 font-black">{title}</h1>}
            {description && (
              <span className="text-sm text-gray-600 dark:text-gray-500">
                {description}
              </span>
            )}
          </div>
          <div className="flex justify-center md:justify-start">{children}</div>
          <div className="w-full flex justify-center md:justify-start items-center pt-7">
            <Link
              href="https://auroralabs.dev"
              target="_blank"
              rel="noreferrer"
              className="flex justify-center items-center text-sm text-secondary gap-1.5 bg-white px-3 py-1.5 rounded-full dark:bg-gray-700 dark:text-white"
            >
              <span>Powered by</span>
              <Image
                src="/static/templates/turboswap/aurora-labs-logo.svg"
                width={16}
                height={16}
                alt="Aurora Labs logo"
              />
              <span className="text-black-400 dark:text-white">
                Aurora Labs
              </span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 justify-start items-center mt-[5.5rem]">
      <div className="w-full md:w-auto md:min-w-[512px]">
        <div className="flex flex-col mb-8 text-center">
          {title && <h1 className="mb-3 font-black">{title}</h1>}
          {description && (
            <span className="text-sm text-gray-600 dark:text-gray-500">
              {description}
            </span>
          )}
        </div>
        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  )
}

export default Paper
