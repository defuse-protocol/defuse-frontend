import { Text } from "@radix-ui/themes"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@src/components/DefuseSDK/components/Tooltip"

export const CexTooltip = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Text
          size="1"
          color="amber"
          weight="medium"
          as="span"
          className="cursor-pointer text-warning-foreground transition-colors outline-none focus:outline-none"
        >
          Why is this important?
        </Text>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-[320px] sm:max-w-[400px] p-4"
        sideOffset={8}
      >
        <div className="flex flex-col gap-2">
          <Text size="1" weight="medium" className="leading-relaxed">
            Certain exchanges, such as MEXC, Bitunix, and Bitget, may not
            properly detect some tokens because of standard mismatches. This may
            lead to lost or delayed funds. Please note that other exchanges
            could have similar issues.
          </Text>

          <Text size="1" weight="medium" className="leading-relaxed">
            💡 Tip: Always perform a minimal test withdrawal the first time you
            send funds to an exchange address.
          </Text>

          <Text size="1" className="leading-relaxed">
            ⚠️ Note: By checking this box, you confirm that you understand the
            risks and take full responsibility for this withdrawal.
          </Text>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
