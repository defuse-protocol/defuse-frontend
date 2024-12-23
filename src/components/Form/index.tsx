"use client"

import React, {
  type PropsWithChildren,
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type FormEventHandler,
} from "react"
import type {
  FieldValues,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form"

import { FieldComboInputRegistryName } from "@src/components/Form/FieldComboInput"
import { FieldTextInputRegistryName } from "@src/components/Form/FieldTextInput"

// Define an interface for components that accept register as a prop
interface RegisterProps<T extends FieldValues> {
  register: UseFormRegister<T>
}

interface Props<T extends FieldValues> extends PropsWithChildren {
  register: UseFormRegister<T>
  handleSubmit: UseFormHandleSubmit<T> | FormEventHandler<T> | undefined
}

const Form = <T extends FieldValues>({
  children,
  handleSubmit,
  register,
}: Props<T>) => {
  const allowedComponents = [
    FieldComboInputRegistryName,
    FieldTextInputRegistryName,
  ]

  const childrenWithProps = Children.map(children, (child) => {
    if (isValidElement(child)) {
      // biome-ignore lint/suspicious/noExplicitAny: Avoid an error TS2339
      const childType = child.type as any
      const childName =
        childType.displayName || childType.name || childType?.type?.name
      if (allowedComponents.includes(childName)) {
        // Ensure that the child is a ReactElement and pass the register prop correctly
        return cloneElement(child as ReactElement<RegisterProps<T>>, {
          register,
        })
      }
    }
    return child
  })

  // biome-ignore lint/suspicious/noExplicitAny: <reason>
  return <form onSubmit={handleSubmit as any}>{childrenWithProps}</form>
}

export default Form
