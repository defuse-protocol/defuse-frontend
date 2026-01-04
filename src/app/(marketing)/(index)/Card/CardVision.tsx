import { Text } from "@radix-ui/themes"
import clsx from "clsx"
import Image from "next/image"
import type { ReactNode } from "react"

type Props = {
  title: string | ReactNode
  description: string | ReactNode
  background?: string
  cover?: string
  isReverse?: boolean
  variant?: "right-bottom" | "center-bottom"
}

const CardVision = ({
  title,
  description,
  background,
  cover,
  isReverse,
}: Props) => {
  return (
    <div
      className={clsx(
        "w-full h-[502px] md:h-[364px] flex flex-col md:flex-row shadow-card-multi bg-white rounded-[40px] overflow-hidden flex-wrap",
        isReverse && "md:flex-row-reverse"
      )}
    >
      <div
        className={clsx(
          "basis-6/12 flex flex-col px-[32px] pt-[32px] lg-py-0 justify-start md:justify-center items-center w-full md:max-w-[494px] z-20",
          isReverse ? "lg:pr-[64px] lg:pl-0" : "lg:pl-[64px] lg:pr-0"
        )}
      >
        <Text
          className={clsx(
            "text-[20px] md:text-[32px] font-black text-black-400 mb-2 md:mb-4 self-start"
          )}
        >
          {title}
        </Text>
        {description && (
          <Text className="text-[14px] md:text-[18px] font-bold text-gray-11">
            {description}
          </Text>
        )}
      </div>
      <div className="relative basis-4/12 grow h-[262px] md:h-auto lg:py-5 pointer-events-none">
        <div className={clsx("w-full h-full bg-no-repeat", background)} />
        {cover && (
          <div className="absolute -top-2/4 left-[14px] translate-y-1/2 w-[calc(100%-28px)] h-[calc(100%-14px)] md:w-[calc(100%-128px)] md:h-full flex justify-center items-center">
            <Image
              src={cover}
              fill
              alt="Card Multi Cover"
              style={{ objectFit: "fill" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CardVision
