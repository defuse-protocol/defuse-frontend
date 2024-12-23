"use client"

import { Text } from "@radix-ui/themes"
import clsx from "clsx"
import dayjs from "dayjs"
import { type ComponentType, Fragment } from "react"

type Props<T extends { timestamp: number }> = {
  Component: ComponentType<T>
  data: T[]
  className?: string
}

const groupByDay = <T extends { timestamp: number }>(
  data: T[]
): { [key: string]: T[] } => {
  return data.reduce(
    (acc, transaction) => {
      const date = dayjs(transaction.timestamp / 10 ** 6).format("MMM D, YYYY")
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(transaction)
      return acc
    },
    {} as { [key: string]: T[] }
  )
}

const WidgetTransactionsList = <T extends { timestamp: number }>({
  data,
  className,
  Component,
}: Props<T>) => {
  const groupedData = groupByDay<T>(data)

  return (
    <div
      className={clsx(
        "flex flex-col max-h-[570px] p-1",
        className && className
      )}
    >
      <Text size="4" weight="bold">
        Transactions
      </Text>
      <div className="overflow-auto">
        {Object.keys(groupedData).map((date, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
          <Fragment key={index}>
            <div className="z-10 sticky top-0 pt-5 pb-3 text-xs font-medium text-gray-600 border-b border-gray-100 bg-white-100 dark:bg-black-900 dark:text-gray-500">
              {date}
            </div>
            {groupedData[date].map((props, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
              <Component key={idx} {...props} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default WidgetTransactionsList
