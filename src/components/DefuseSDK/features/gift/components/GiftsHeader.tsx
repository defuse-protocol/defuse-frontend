"use client"

import { PlusIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"

type GiftsHeaderProps = {
  onCreateClick: () => void
  disabled?: boolean
}

export function GiftsHeader({ onCreateClick, disabled }: GiftsHeaderProps) {
  return (
    <>
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        Gifts
      </h1>

      <div className="mt-6 flex items-center justify-end">
        <Button
          size="lg"
          variant="primary"
          onClick={onCreateClick}
          disabled={disabled}
        >
          <PlusIcon className="size-4" />
          Create gift
        </Button>
      </div>
    </>
  )
}
