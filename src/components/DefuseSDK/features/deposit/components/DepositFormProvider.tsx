import type { PropsWithChildren } from "react"
import { FormProvider, useForm } from "react-hook-form"
import type { DepositFormValues } from "./DepositForm"

type DepositFormProps = PropsWithChildren

export function DepositFormProvider({ children }: DepositFormProps) {
  const methods = useForm<DepositFormValues>({
    defaultValues: {
      token: null,
      network: null,
      amount: "",
      userAddress: "",
    },
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}
