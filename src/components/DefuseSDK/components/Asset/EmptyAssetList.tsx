import { Text } from "@radix-ui/themes"
import clsx from "clsx"

type Props = {
  className?: string
}
export const EmptyAssetList = ({ className }: Pick<Props, "className">) => {
  return (
    <div
      className={clsx(
        "flex-1 w-full flex flex-col justify-center items-center text-center -mt-10",
        className && className
      )}
    >
      <div className="flex justify-center items-center rounded-full bg-gray-950 p-6 mb-4">
        <img
          src="/static/icons/cross-1.svg"
          alt="Close"
          width={32}
          height={32}
        />
      </div>
      <Text size="4" weight="bold">
        Your token not found
      </Text>
      <Text size="2" weight="medium" className="text-gray-11">
        Try depositing to your wallet.
      </Text>
    </div>
  )
}
