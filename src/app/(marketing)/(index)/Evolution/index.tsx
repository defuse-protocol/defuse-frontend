"use client"

import { Text } from "@radix-ui/themes"
import { useEffect, useRef, useState } from "react"
import Section from "../Section"
import TableInfrastructure from "../Table/TableInfrastructure"
import { infrastructureData } from "../mocks"

import { settings } from "@src/config/settings"

const Evolution = () => {
  const divRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    setContainerWidth(divRef.current ? divRef.current.offsetWidth : 0)
  }, [])

  return (
    <Section title="The Evolution of Trading Platforms">
      <div
        className="flex flex-col justify-center mb-[40px] md:mb-[96px]"
        ref={divRef}
      >
        <p className="text-center text-[20px] md:text-[32px] font-black text-gray-11">
          <Text as="span">
            {settings.appName} unifies the best of CEXs and DEXs with a
            scalable, multi-chain infrastructure. Our goal is to&nbsp;
          </Text>
          <Text as="span" className="text-primary">
            minimize centralization risks, unify liquidity, and unlock
            DeFi&apos;s full potential
          </Text>
          <Text as="span">
            , creating the perfect hub for the next generation of decentralized
            finance.
          </Text>
        </p>
      </div>
      <TableInfrastructure
        data={infrastructureData}
        maxWidth={containerWidth}
      />
    </Section>
  )
}

export default Evolution
