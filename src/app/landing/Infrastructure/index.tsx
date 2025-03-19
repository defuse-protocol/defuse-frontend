"use client"

import { Text } from "@radix-ui/themes"
import Image from "next/image"
import { type PropsWithChildren, useEffect, useRef, useState } from "react"

import Section from "@src/app/landing/Section"
import { settings } from "@src/config/settings"

const CardTopic = ({ children, id }: { id: number } & PropsWithChildren) => {
  return (
    <div className="flex justify-center gap-2.5 md:flex-col">
      <div className="flex justify-center items-center w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-full bg-primary text-white">
        <Text size="6">{id}</Text>
      </div>
      <Text size="5" weight="bold">
        {children}
      </Text>
    </div>
  )
}

const Infrastructure = () => {
  const divRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    setContainerWidth(divRef.current?.offsetWidth || 0)
  }, [])

  return (
    <Section title={`${settings.appName} Infrastructure`}>
      <div className="flex flex-col justify-center">
        <p className="text-center text-[20px] md:text-[32px] font-black text-gray-600 mb-4 md:mb-5">
          <Text as="span">
            Your Near account holds remote accounts on separate chains, making
            it easy to swap tokens across any network.
          </Text>
        </p>
        <div
          className="relative w-full h-[496px] md:h-[412px] overflow-hidden rounded-[40px] mb-[40px] md:mb-[56px]"
          ref={divRef}
        >
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={
                containerWidth <= 768
                  ? "/static/images/Infrastructure--mobile.svg"
                  : "/static/images/Infrastructure.svg"
              }
              alt={`${settings.appName} Infrastructure`}
              layout="fill"
              objectFit="contain"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-5 mb-[96px] md:mb-[128px]">
          <div className="w-full text-center md:text-left md:w-1/3 min-w-[280px] flex-1">
            <div className="flex flex-col gap-3">
              <CardTopic id={1}>User Intent</CardTopic>
              <Text size="2" weight="medium" className="text-gray-600">
                Users start by expressing their intent to perform a specific
                financial operation, such as trading a token or lending assets.
              </Text>
            </div>
          </div>
          <div className="w-full text-center md:text-left md:w-1/3 min-w-[280px] flex-1">
            <div className="flex flex-col gap-3">
              <CardTopic id={2}>Solver Participation</CardTopic>
              <Text size="2" weight="medium" className="text-gray-600">
                Active market participants, known as solvers, monitor these
                intents and express their willingness to fulfill them. Solvers
                ensure liquidity and efficient execution by matching user
                intents.
              </Text>
            </div>
          </div>
          <div className="w-full text-center md:text-left md:w-1/3 min-w-[280px] flex-1">
            <div className="flex flex-col gap-3">
              <CardTopic id={3}>Transaction Fulfillment</CardTopic>
              <Text size="2" weight="medium" className="text-gray-600">
                Once a solver matches the user’s intent, the transaction is
                executed. This may involve additional steps, such as user
                approval or selecting the best offer in an auction scenario.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default Infrastructure
