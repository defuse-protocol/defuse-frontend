import { ChevronDownIcon } from "@radix-ui/react-icons"
import * as RadixSelect from "@radix-ui/react-select"
import { Theme } from "@radix-ui/themes"
import type { ReactNode } from "react"

type Props<T extends string> = {
  name: string
  options: {
    [key in T extends string ? T : never]: {
      label: string
      icon: ReactNode
      value: string
    }
  }
  placeholder: { label: string; icon: ReactNode }
  label?: string
  disabled?: boolean
  value?: string
  hint?: ReactNode
  renderValueDetails?: (address: string) => ReactNode
  onChange?: (value: string) => void
}

export function Select<T extends string>({
  name,
  options,
  placeholder,
  label,
  disabled,
  value,
  hint,
  onChange,
  renderValueDetails,
}: Props<T>) {
  return (
    <RadixSelect.Root
      onValueChange={onChange}
      value={value}
      name={name}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        className="h-12 gap-3 rounded-lg bg-gray-3 px-4 text-gray-12 leading-6 ring-accent-9 ring-inset transition-all duration-100 ease-in-out hover:bg-gray-4 data-[state=open]:bg-gray-4 data-[state=open]:ring-2"
        aria-label={label ?? "Not specified"}
        disabled={disabled}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="hidden items-center gap-2 in-data-placeholder:flex">
            {placeholder?.icon && <div>{placeholder.icon}</div>}
            <div className="font-medium text-gray-11 text-sm">
              {placeholder?.label}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-between in-data-placeholder:hidden">
            <div className="font-bold text-sm">
              <RadixSelect.Value />
            </div>
            {hint != null ? hint : null}
          </div>

          {Object.keys(options).length > 1 ? (
            <RadixSelect.Icon>
              <ChevronDownIcon className="size-7" />
            </RadixSelect.Icon>
          ) : null}
        </div>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <Theme asChild>
          <RadixSelect.Content
            className="box-border max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) max-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-gray-1 shadow-2xl"
            position="popper"
            side="bottom"
            sideOffset={8}
          >
            <RadixSelect.Viewport className="flex flex-col gap-1 p-2">
              {Object.keys(options).map((key: string) => {
                return (
                  <SelectItem
                    key={key}
                    value={options[key as keyof typeof options].value}
                    renderValueDetails={renderValueDetails}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        {options[key as keyof typeof options]?.icon && (
                          <div className="shrink-0">
                            {options[key as keyof typeof options].icon}
                          </div>
                        )}
                        <div>{options[key as keyof typeof options].label}</div>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </Theme>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

interface SelectItemProps {
  value: string
  children: ReactNode
  renderValueDetails?: (address: string) => ReactNode
}

function SelectItem({ value, children, renderValueDetails }: SelectItemProps) {
  return (
    <RadixSelect.Item
      className="relative flex w-full select-none items-center justify-between gap-3 self-stretch rounded-md p-2 font-bold text-gray-12 text-sm data-disabled:pointer-events-none data-highlighted:bg-gray-3 data-[state=checked]:bg-gray-3 data-disabled:text-gray-8 data-highlighted:outline-hidden"
      value={value}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      {renderValueDetails?.(value)}
    </RadixSelect.Item>
  )
}

Select.Hint = function Badge({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm bg-gray-a3 px-2 py-1 font-medium text-gray-a11 text-xs">
      {children}
    </div>
  )
}
