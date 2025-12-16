import { ReloadIcon } from "@radix-ui/react-icons"
import { Button, type ButtonProps, Flex, Text } from "@radix-ui/themes"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "../../utils/cn"

interface ButtonCustomProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  children?: ReactNode
  variant?: "primary" | "secondary" | "base" | "soft" | "solid" | "danger"
  color?: ButtonProps["color"]
  variantRadix?: ButtonProps["variant"]
  size?: "sm" | "base" | "lg"
  fullWidth?: boolean
  isLoading?: boolean
}

export const ButtonCustom = ({
  children,
  variant = "primary",
  color,
  size = "base",
  variantRadix,
  fullWidth,
  disabled,
  isLoading = false,
  className,
  ...rest
}: ButtonCustomProps) => {
  let radixButtonVariant: ButtonProps["variant"]
  let radixButtonColor: ButtonProps["color"]
  switch (variant) {
    case "primary":
      radixButtonVariant = undefined
      break
    case "secondary":
      radixButtonVariant = "outline-solid"
      radixButtonColor = "gray"
      break
    case "base":
      radixButtonVariant = "solid"
      radixButtonColor = "gray"
      break
    case "danger":
      radixButtonVariant = "outline-solid"
      radixButtonColor = "red"
      break
  }
  radixButtonColor = color ?? radixButtonColor
  radixButtonVariant = variantRadix ?? radixButtonVariant

  let radixButtonSize: ButtonProps["size"] | undefined
  switch (size) {
    case "sm":
      radixButtonSize = "1"
      break
    case "base":
      break
    case "lg":
      radixButtonSize = "4"
      break
  }

  return (
    <Flex align="center" gap="2" asChild>
      <Button
        color={radixButtonColor}
        variant={radixButtonVariant}
        size={radixButtonSize}
        disabled={disabled || isLoading}
        className={cn(
          !disabled && "cursor-pointer",
          { sm: "h-8", base: "h-10", lg: "h-14" }[size],
          className
        )}
        {...rest}
      >
        {isLoading ? <ReloadIcon className="size-5 animate-spin" /> : null}
        <Text weight="bold">{children}</Text>
      </Button>
    </Flex>
  )
}
