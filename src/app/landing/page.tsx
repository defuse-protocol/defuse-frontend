"use client"

import Banner from "@src/app/landing/Banner"
import CardSocial from "@src/app/landing/Card/CardSocial"
import Evolution from "@src/app/landing/Evolution"
import FAQ from "@src/app/landing/FAQ"
import Infrastructure from "@src/app/landing/Infrastructure"
import Interested from "@src/app/landing/Interested"
import PaperHome from "@src/app/landing/PaperHome"
import TryDefuse from "@src/app/landing/TryDefuse"
// import InvestorLogo from "@src/app/landing/InvestorLogo"
import Vision from "@src/app/landing/Vision"
import { settings } from "@src/config/settings"
import {
  LINK_DOCS,
  SOCIAL_LINK_DISCORD,
  SOCIAL_LINK_X,
} from "@src/utils/environment"

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
            link={SOCIAL_LINK_X}
          />
          <CardSocial
            name="Join Discord"
            icon="/static/icons/discord.svg"
            link={SOCIAL_LINK_DISCORD}
          />
          <CardSocial
            name="Documentation"
            icon="/static/icons/Docs.svg"
            link={LINK_DOCS}
          />
        </div>
      </div>
    </div>
  )
}
