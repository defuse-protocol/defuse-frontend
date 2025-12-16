"use client"

import { settings } from "@src/config/settings"
import Banner from "./Banner"
import CardSocial from "./Card/CardSocial"
import Evolution from "./Evolution"
import FAQ from "./FAQ"
import Infrastructure from "./Infrastructure"
import Interested from "./Interested"
import PaperHome from "./PaperHome"
import TryDefuse from "./TryDefuse"
// import InvestorLogo from "./InvestorLogo"
import Vision from "./Vision"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 justify-start item-center">
      <Banner />
      <TryDefuse />
      <PaperHome>
        {/* TODO Hidden until investment information is available */}
        {/*<InvestorLogo />*/}
        <Vision />
        <Evolution />
        <Infrastructure />
        <Interested />
        <FAQ />
      </PaperHome>
      <div className="flex flex-col mt-[56px] md:mt-[108px] mb-[39px] md:mb-[106px]">
        <div className="max-w-[189px] md:max-w-full mx-auto mb-[28px] md:[56px]">
          <h2 className="font-black mb-5 text-gray-11 text-[32px] md:text-5xl text-center">
            Connect with {settings.appName}
          </h2>
        </div>
        <div className="w-full justify-center flex flex-wrap gap-5 px-5">
          <CardSocial
            name="Follow on X"
            icon="/static/icons/X.svg"
            link="https://x.com/DefuseProtocol"
          />
          <CardSocial
            name="Join Discord"
            icon="/static/icons/discord.svg"
            link="https://discord.gg/rdGAgDRs"
          />
          <CardSocial
            name="Documentation"
            icon="/static/icons/Docs.svg"
            link="https://docs.near-intents.org"
          />
        </div>
      </div>
    </div>
  )
}
