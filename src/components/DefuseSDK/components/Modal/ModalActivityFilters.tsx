import * as RadioGroup from "@radix-ui/react-radio-group"
import Button from "@src/components/Button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BaseModalDialog } from "./ModalDialog"

export const TYPE_OPTIONS = ["All", "Swap"] as const
export const STATUS_OPTIONS = ["All", "Success", "Pending", "Failed"] as const

export type TypeFilter = (typeof TYPE_OPTIONS)[number]
export type StatusFilter = (typeof STATUS_OPTIONS)[number]

type ModalActivityFiltersProps = {
  open: boolean
  onClose: () => void
  currentSearchParams: URLSearchParams
}

const ModalActivityFilters = ({
  open,
  onClose,
  currentSearchParams,
}: ModalActivityFiltersProps) => {
  const router = useRouter()

  const initialType = currentSearchParams.get("type") as TypeFilter | null
  const initialStatus = currentSearchParams.get("status") as StatusFilter | null

  const [type, setType] = useState<TypeFilter>(
    initialType && TYPE_OPTIONS.includes(initialType) ? initialType : "All"
  )
  const [status, setStatus] = useState<StatusFilter>(
    initialStatus && STATUS_OPTIONS.includes(initialStatus)
      ? initialStatus
      : "All"
  )

  const handleApply = () => {
    const newSearchParams = new URLSearchParams(currentSearchParams)

    if (type !== "All") {
      newSearchParams.set("type", type)
    } else {
      newSearchParams.delete("type")
    }

    if (status !== "All") {
      newSearchParams.set("status", status)
    } else {
      newSearchParams.delete("status")
    }

    const query = newSearchParams.toString()
    router.push(query ? `/activity?${query}` : "/activity")
    onClose()
  }

  return (
    <BaseModalDialog title="Filter transactions" open={open} onClose={onClose}>
      <div className="space-y-6 mt-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Type</h3>
          <RadioGroup.Root
            value={type}
            onValueChange={(value) => setType(value as TypeFilter)}
            className="grid grid-cols-4 gap-1 mt-2"
          >
            {TYPE_OPTIONS.map((option) => (
              <RadioGroup.Item key={option} value={option} asChild>
                <Button
                  variant={type === option ? "primary" : "secondary"}
                  size="lg"
                >
                  {option}
                </Button>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">Status</h3>
          <RadioGroup.Root
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
            className="grid grid-cols-4 gap-1 mt-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <RadioGroup.Item key={option} value={option} asChild>
                <Button
                  variant={status === option ? "primary" : "secondary"}
                  size="lg"
                >
                  {option}
                </Button>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-8">
          <Button variant="secondary" size="xl" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="xl" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </BaseModalDialog>
  )
}

export default ModalActivityFilters
