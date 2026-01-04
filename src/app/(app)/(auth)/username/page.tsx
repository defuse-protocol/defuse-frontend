"use client"

import Button from "@src/components/Button"
import ErrorMessage from "@src/components/ErrorMessage"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import {
  adjectives,
  nouns,
  uniqueUsernameGenerator,
} from "unique-username-generator"

interface UsernameFormData {
  username: string
}

export default function SignupPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UsernameFormData>()

  const onSubmit = async ({ username }: UsernameFormData) => {
    // TODO: Handle form submission

    username = username.trim()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    router.push("/account")
  }

  const generateRandomUsername = () => {
    const username = uniqueUsernameGenerator({
      dictionaries: [adjectives, nouns],
      style: "titleCase",
      length: 20,
    })

    setValue("username", username, { shouldValidate: true })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full flex flex-col items-center">
        <div className="flex items-center justify-center size-20 bg-gray-100 rounded-2xl mx-auto">
          logo
        </div>

        <h1 className="mt-12 text-3xl font-bold text-gray-900 text-center text-balance leading-[1.1] tracking-tight">
          Set your username
        </h1>

        <p className="text-center text-base text-gray-500 text-balance mt-4">
          This is your public @username. Share it to receive transfers from
          other users.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full mt-8">
          <div
            className={clsx(
              "rounded-2xl bg-white px-4 py-3 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2",
              errors.username
                ? "outline-red-500 focus-within:outline-red-500"
                : "outline-gray-200 focus-within:outline-gray-900"
            )}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="username"
                className="flex-1 text-sm text-gray-500 leading-none"
              >
                Username
              </label>
              <button
                type="button"
                onClick={generateRandomUsername}
                className="text-sm text-gray-500 leading-none underline hover:text-gray-900"
              >
                Generate
              </button>
            </div>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="pt-1.5 block w-full text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none text-base leading-none ring-0 border-none p-0"
              {...register("username", {
                required: "Enter your username.",
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message:
                    "Only letters, numbers, and underscores are allowed.",
                },
                minLength: {
                  value: 3,
                  message: "Must be between 3 and 20 characters long.",
                },
                maxLength: {
                  value: 20,
                  message: "Must be between 3 and 20 characters long.",
                },
              })}
            />
          </div>
          {errors.username && (
            <ErrorMessage className="mt-2 text-center">
              {errors.username.message}
            </ErrorMessage>
          )}

          <Button
            type="submit"
            size="xl"
            fullWidth
            className="mt-3"
            loading={isSubmitting}
          >
            Save username
          </Button>
        </form>

        <div className="rounded-2xl bg-gray-100 p-4 w-full mt-8">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 font-medium">
            <li>Your username is permanent and cannot be changed.</li>
            <li>Only letters, numbers, and underscores are allowed.</li>
            <li>Must be between 3 and 20 characters long.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
