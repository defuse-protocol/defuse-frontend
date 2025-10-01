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
          className="cursor-pointer text-warning-foreground transition-colors"
        >
          Why is this important?
        </Text>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-[320px] p-4"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div>
            <Text size="1" weight="medium" className="leading-relaxed">
              Some centralized exchanges (e.g., MEXC, Bitunix, Bitget) may not
              properly detect certain tokens due to standard mismatches. This
              can lead to lost or delayed funds.
            </Text>
          </div>

          <div className="pt-1 border-t border-amber-700/30">
            <Text size="1" weight="medium" className="leading-relaxed">
              💡 Tip: If this is your first time withdrawing to your exchange
              address, always make a small test withdrawal (STW) first.
            </Text>
          </div>

          <div className="pt-1 border-t border-amber-700/30">
            <Text size="1" className="leading-relaxed">
              ⚠️ Note: By checking this box, you confirm that you understand the
              risks and take full responsibility for this withdrawal.
            </Text>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
