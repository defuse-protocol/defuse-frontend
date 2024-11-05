import { Text } from "@radix-ui/themes"

import CardInvestorLogo from "@src/app/landing/Card/CardInvestorLogo"

const InvestorLogo = () => {
  return (
    <div className="w-full pt-[32px] md:pt-[48px] pb-0 md:pb-[54px] ">
      <Text
        as="p"
        size="2"
        className="text-black-200 text-center"
        weight="bold"
      >
        BACKED BY THE BEST
      </Text>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-4 justify-items-center">
        <CardInvestorLogo src="/static/logos/Aurora.svg" />
        <CardInvestorLogo title="Investor logo" />
        <CardInvestorLogo title="Investor logo" />
        <CardInvestorLogo title="Partner logo" />
      </div>
    </div>
  )
}

export default InvestorLogo
