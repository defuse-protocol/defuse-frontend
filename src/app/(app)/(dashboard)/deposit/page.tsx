import BankingPromo from "@src/components/BankingPromo"
import DepositPromo from "@src/components/DepositPromo"
import PageHeader from "@src/components/PageHeader"
import clsx from "clsx"
import Link from "next/link"
import type { ReactNode } from "react"
// import Button from "@src/components/Button"
// import { EurIcon, UsdIcon } from "@src/icons"

const Card = ({
  children,
  className,
  disabled,
}: {
  children: ReactNode
  className?: string
  disabled?: boolean
}) => (
  <div
    className={clsx(
      "relative rounded-3xl bg-surface-card border border-border p-4",
      {
        "hover:border-border-strong hover:outline hover:outline-border-strong has-focus-visible:border-fg has-focus-visible:outline has-focus-visible:outline-fg":
          !disabled,
      },
      className
    )}
  >
    {children}
  </div>
)

export default function DepositPage() {
  return (
    <>
      <PageHeader title="Add funds to your NEAR Intents account" />

      <section className="mt-6 space-y-2">
        <Card>
          <Link
            href="/deposit/crypto"
            className="text-fg text-lg font-semibold focus-visible:outline-none"
          >
            <span className="absolute inset-0 rounded-3xl" />
            Deposit crypto
          </Link>
          <p className="text-fg-secondary text-sm font-medium mt-1">
            Send crypto from an external wallet or exchange
          </p>

          <DepositPromo className="mt-9" />
        </Card>

        <BankingPromo />

        {/* <div>
          <Card
            className="flex justify-between gap-3 items-start"
            disabled={!verified}
          >
            <div
              className={clsx({
                "opacity-50": !verified,
              })}
            >
              <div>
                {verified ? (
                  <Link
                    href="/deposit/bank"
                    className="text-fg text-lg font-semibold focus-visible:outline-none"
                  >
                    <span className="absolute inset-0 rounded-3xl" />
                    Deposit via bank transfer
                  </Link>
                ) : (
                  <div className="text-fg text-lg font-semibold">
                    Deposit via bank transfer
                  </div>
                )}
                <p className="text-fg-secondary text-sm font-medium mt-1 text-balance">
                  Send USD or EUR from your bank and receive stablecoins
                </p>
              </div>

              <div className="flex -space-x-2 mt-9">
                <UsdIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
                <EurIcon className="size-10 shrink-0 ring-2 -ring-offset-2 ring-white rounded-full" />
              </div>
            </div>

            <div className="rounded-md bg-red-100 px-2 py-1.5 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-red-700 text-xs/none font-semibold whitespace-pre">
                KYC required
              </span>
            </div>
          </Card>

          {!verified && (
            <div className="p-4 pt-3 bg-surface-active rounded-b-3xl border border-border -mt-6">
              <p className="text-sm font-medium text-fg-secondary text-balance mt-6">
                Bank transfers require identity verification. This usually takes
                3–5 minutes.
              </p>
              <Button size="md" className="mt-3">
                Start verification
              </Button>
            </div>
          )}
        </div> */}
      </section>
    </>
  )
}
