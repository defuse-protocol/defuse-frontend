import type { PropsWithChildren } from "react"
import { FormProvider, useForm } from "react-hook-form"
import type { SwapFormValues } from "./SwapForm"

type SwapFormProps = PropsWithChildren

export function SwapFormProvider({ children }: SwapFormProps) {
  const methods = useForm<SwapFormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      amountIn: "",
      amountOut: "",
    },
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}
