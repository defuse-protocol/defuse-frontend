import { ArrowTopRightIcon } from "@radix-ui/react-icons"
import { Button } from "@radix-ui/themes"

const WidgetCardLink = () => {
  return (
    <Button
      variant="solid"
      color="gray"
      className="relative w-[32px] h-[32px] cursor-pointer"
    >
      <div className="absolute">
        <ArrowTopRightIcon width={16} height={16} />
      </div>
    </Button>
  )
}

export default WidgetCardLink
