import { Text } from "@radix-ui/themes"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"

import type { JobsDetails } from "@src/types/interfaces"

const CardJob = ({ team, position, link, applicationLink }: JobsDetails) => {
  const animationStyle =
    "transition ease-in-out hover:-translate-y-[5px] duration-150"
  return (
    <Link
      href={link}
      className={clsx(
        "min-h-[147px] flex flex-col p-4 ld:p-8 shadow-card-multi bg-gray-1 rounded-2xl",
        animationStyle
      )}
    >
      <div className="w-full h-[24px] flex justify-end">
        <span className="lg:translate-y-0 lg:top-5 right-5">
          <Image
            src="/static/icons/arrow-top-right.svg"
            width={16}
            height={16}
            alt="Link Icon"
          />
        </span>
      </div>
      <div className="flex flex-col gap-2 px-8 py-4">
        {applicationLink ? (
          <Text
            size="1"
            weight="medium"
            wrap="nowrap"
            className="w-fit bg-primary rounded-full text-white px-3 py-2 text-sm"
          >
            Open Application
          </Text>
        ) : (
          <Text as="p" size="3">
            {team}
          </Text>
        )}
        <Text as="p" size="4">
          {position}
        </Text>
      </div>
    </Link>
  )
}

export default CardJob
