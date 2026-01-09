"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { useActivityDock } from "@src/providers/ActivityDockProvider"
import Button from "./Button"

const ActivityDock = () => {
  const { dockItems, removeDockItem } = useActivityDock()

  return (
    <div className="flex flex-col justify-end w-full mt-auto grow pb-32">
      {dockItems.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl p-3 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="size-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center outline-1 outline-gray-900/10 -outline-offset-1">
              {item.icon}
            </div>
            <p className="flex-1 text-sm font-semibold text-gray-700">
              {item.title}
            </p>
          </div>

          {item.keyValueRows.length > 0 && (
            <dl className="mt-4 space-y-2 overflow-hidden">
              {item.keyValueRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="text-sm text-gray-500 font-medium whitespace-nowrap">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 whitespace-nowrap truncate">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-col gap-2 mt-4">
            {item.explorerUrl && (
              <Button
                href={item.explorerUrl}
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                View on explorer
                <ArrowTopRightOnSquareIcon className="size-4" />
              </Button>
            )}

            <Button
              onClick={() => removeDockItem(item.id)}
              variant="secondary"
              className="border border-gray-200"
              fullWidth
            >
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityDock
