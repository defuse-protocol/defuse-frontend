import { Text } from "@radix-ui/themes"
import Image from "next/image"

type CardInvestorLogoProps = {
  src?: string
  title?: string
}

const CardInvestorLogo = ({ src, title }: CardInvestorLogoProps) => {
  return (
    <div className="flex justify-center items-center w-full md:w-[238px] h-[90px] border border-black-100 rounded-2xl p-8">
      <div className="relative w-full flex justify-center items-center min-h-[25px] md:min-h-[35px]">
        {src && (
          <Image
            src={src}
            fill
            alt="Card Investor Logo"
            style={{ objectFit: "contain" }}
          />
        )}
        {title && (
          <Text
            size="4"
            weight="bold"
            className="text-gray-11 whitespace-nowrap"
          >
            {title}
          </Text>
        )}
      </div>
    </div>
  )
}

export default CardInvestorLogo
