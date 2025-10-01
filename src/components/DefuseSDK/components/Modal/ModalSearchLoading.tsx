import { Spinner, Text } from "@radix-ui/themes"

export const ModalSearchLoading = () => {
  return (
    <div className="flex justify-center items-center flex-col gap-4">
      <Text as="p" size="2" weight="medium" className="pt-[30%] text-gray-11">
        Searching assets
      </Text>
      <Spinner size="3" />
    </div>
  )
}
