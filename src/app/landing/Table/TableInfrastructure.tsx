import { Text } from "@radix-ui/themes"
import { settings } from "@src/config/settings"
import clsx from "clsx"
import Image from "next/image"
import React, { type PropsWithChildren } from "react"

export enum ColumnGroupType {
  MAIN = "main",
  PRIMARY = "primary",
}

export interface InfrastructureProps {
  featureDesc: string
  featureIcon: string
  dexDesc: string
  cexDesc: string
  defuseDesc: string
}

type Props = {
  data: InfrastructureProps[]
  maxWidth: number
}

const ComponentHead = ({
  group,
  children,
}: { group?: ColumnGroupType } & PropsWithChildren) => {
  return (
    <th className="w-[197px] md:w-[260px] pr-0 xl:pr-5">
      <div
        className={clsx(
          "w-full py-5 px-8 rounded-t-2xl bg-gray-a3 font-black",
          group === ColumnGroupType.PRIMARY && "bg-primary-100 text-white"
        )}
      >
        <Text size="6" className="leading-10">
          {children}
        </Text>
      </div>
    </th>
  )
}

const ComponentBody = ({
  icon,
  group,
  children,
  isLastRow,
}: {
  group?: ColumnGroupType
  icon?: string
  isLastRow: boolean
} & PropsWithChildren) => {
  return (
    <td className={clsx(group === ColumnGroupType.PRIMARY && "pr-0 xl:pr-5")}>
      <div
        className={clsx(
          "flex items-center gap-3 w-full h-[112px] py-5 px-8 border-white-200 text-gray-11",
          group === ColumnGroupType.MAIN ? "font-black" : "font-medium",
          group === ColumnGroupType.PRIMARY && "bg-primary text-white",
          isLastRow ? "border-b-0" : "border-b-2",
          group === ColumnGroupType.PRIMARY &&
            isLastRow &&
            "rounded-b-2xl border-b-0"
        )}
      >
        {group === ColumnGroupType.MAIN && icon && (
          <Image src={icon} alt="Group Icon" width={24} height={24} />
        )}
        {(children as string)?.length > 90 ? (
          <Text className="text-xs md:text-sm">{children}</Text>
        ) : (
          <Text className="text-sm md:text-base">{children}</Text>
        )}
      </div>
    </td>
  )
}

const TableInfrastructure = ({ data, maxWidth }: Props) => {
  if (!maxWidth) {
    return null
  }
  return (
    <div
      className={clsx("mx-auto min-w-0 -m-5 xl:m-0")}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <div className="block overflow-auto max-h-screen">
        <table className="table-fixed w-full" border={0} cellPadding="0">
          <thead className="sticky top-0">
            <tr>
              <ComponentHead>Feature</ComponentHead>
              <ComponentHead>CEX</ComponentHead>
              <ComponentHead>DEX</ComponentHead>
              <ComponentHead group={ColumnGroupType.PRIMARY}>
                {settings.appName}
              </ComponentHead>
            </tr>
          </thead>
          <tbody>
            {data.map((dataElement, index, array) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <reason>
              <tr key={index}>
                <ComponentBody
                  icon={dataElement.featureIcon}
                  group={ColumnGroupType.MAIN}
                  isLastRow={array.length - 1 === index}
                >
                  {dataElement.featureDesc}
                </ComponentBody>
                <ComponentBody isLastRow={array.length - 1 === index}>
                  {dataElement.cexDesc}
                </ComponentBody>
                <ComponentBody isLastRow={array.length - 1 === index}>
                  {dataElement.dexDesc}
                </ComponentBody>
                <ComponentBody
                  group={ColumnGroupType.PRIMARY}
                  isLastRow={array.length - 1 === index}
                >
                  {dataElement.defuseDesc}
                </ComponentBody>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableInfrastructure
