const defaultFormatOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 2,
}

export function FormattedCurrency({
  value,
  locale,
  formatOptions,
  className,
  mainPartClassName,
  centsClassName,
}: {
  value: number
  formatOptions: Intl.NumberFormatOptions
  locale?: string
  className?: string
  mainPartClassName?: string
  centsClassName?: string
}) {
  const formatter = new Intl.NumberFormat(locale, {
    ...defaultFormatOptions,
    ...formatOptions,
  })
  const parts = formatter.formatToParts(value)
  const decimalPart = parts.findIndex((part) => part.type === "decimal")

  return (
    <div className={className}>
      <span className={mainPartClassName}>
        {parts
          .slice(0, decimalPart)
          .map((part) => part.value)
          .join("")}
      </span>
      <span className={centsClassName}>
        {parts
          .slice(decimalPart)
          .map((part) => part.value)
          .join("")}
      </span>
    </div>
  )
}
