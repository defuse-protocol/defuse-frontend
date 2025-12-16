"use client"

import { Text } from "@radix-ui/themes"

import CardJob from "@src/app/jobs/Card/CardJob"
import { jobsData } from "@src/app/jobs/mocks"

export default function Jobs() {
  return (
    <div className="w-full mx-auto mt-[24px] md:mt-[64px] pl-[5%] pr-[5%] max-w-7xl grid grid-cols-1 md:grid-cols-3 grid-flow-row gap-4 auto-rows-max">
      <div className="my-auto flex flex-col">
        <h1 className="mb-8">Work with us</h1>
        <Text size="4">
          We&apos;re growing fast and continuously looking for talented and
          passionate people to join our team. Please have a look at our open
          positions.
        </Text>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:col-span-2 gap-4">
        {jobsData.map((job, i) => (
          /* biome-ignore lint/suspicious/noArrayIndexKey: <reason> */
          <CardJob key={i} {...job} />
        ))}
      </div>
    </div>
  )
}
