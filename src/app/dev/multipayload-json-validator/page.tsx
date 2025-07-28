"use client"

import { Button, Code } from "@radix-ui/themes"
import React, { useState } from "react"
import * as v from "valibot"

import { MultiPayloadDeepSchema } from "@src/components/DefuseSDK"
import { SPACE } from "@src/constants/constants"

import examples from "./_examples/multipayloads.json"

export default function JsonValidatorPage() {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const [validationResult, setValidationResult] = useState<null | {
    parsed: unknown
    errors: null | ReturnType<typeof formatValibotErrors>
  }>(null)

  const validateJson = (jsonInput: string) => {
    try {
      const parsedJson = JSON.parse(jsonInput)

      try {
        const validated = v.parse(MultiPayloadDeepSchema, parsedJson)
        setValidationResult({
          parsed: validated,
          errors: null,
        })
      } catch (schemaError) {
        if (schemaError instanceof v.ValiError) {
          setValidationResult({
            parsed: parsedJson,
            errors: formatValibotErrors(schemaError),
          })
        }
      }
    } catch (parseError: unknown) {
      // Handle JSON parsing errors
      setValidationResult({
        parsed: null,
        errors: [
          {
            path: "",
            message: `Invalid JSON: ${parseError instanceof Error ? parseError.message : "unknown error"}`,
          },
        ],
      })
    }
  }

  // Format Valibot errors into a more readable structure
  const formatValibotErrors = (
    error: v.ValiError<typeof MultiPayloadDeepSchema>
  ) => {
    if (error.issues) {
      return error.issues.map((issue) => ({
        path: issue.path?.map((p) => p.key).join(".") || "",
        message: issue.message,
      }))
    }
    return [{ path: "", message: error.message }]
  }

  const setJSON = (json: string) => {
    if (textareaRef.current) {
      textareaRef.current.value = json
      validateJson(json)
    }
  }

  return (
    <div className="p-6 mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Multipayload JSON Validation Tool
      </h1>

      <p className="my-4 max-w-xl">
        What is a Multipayload? In short, it's a JSON object which contains
        multiple signed intents that follow a specific schema and can be
        directly executed onchain via the <Code>intents.near</Code> contract.
      </p>

      <p className="my-4 max-w-xl">
        On this page, you can paste a Multipayload JSON object and validate it
        against the schema provided by SDK and see errors if it is malformed.
        The schema is defined in{SPACE}
        <a
          href="https://github.com/defuse-protocol/defuse-sdk/blob/4f01b7b833ad7eddf30af79f738bba4cbb6e02eb/src/features/otcDesk/utils/schemaMultipayload.ts#L115"
          rel="noopener noreferrer"
          className="text-blue-700"
        >
          schemaMultipayload.ts
        </a>
        {SPACE}
        file.
      </p>

      <div className="my-4 flex items-center gap-4">
        Paste an example:
        <Button
          type="button"
          onClick={() => {
            setJSON(JSON.stringify(examples.swap_nep413, null, 2))
          }}
          variant="outline"
        >
          Swap (signed using Near wallet)
        </Button>
        <Button
          type="button"
          onClick={() => {
            setJSON(JSON.stringify(examples.withdraw_raw_ed25519, null, 2))
          }}
          variant="outline"
        >
          Withdraw (signed using Phantom)
        </Button>
        <Button
          type="button"
          onClick={() => {
            setJSON(JSON.stringify(examples.native_withdraw_erc191, null, 2))
          }}
          variant="outline"
        >
          Native Withdraw (signed using MetaMask)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Enter Multipayload JSON
          </h2>
          <textarea
            ref={textareaRef}
            className="w-full h-64 p-2 border rounded font-mono"
            onChange={(e) => {
              validateJson(e.target.value)
            }}
            placeholder='{"standard": "nep413", "payload": {...}, "public_key": "...", "signature": "..."}'
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Validation Result</h2>
          {!validationResult ? (
            <div className="h-64 p-2 border rounded flex items-center justify-center text-gray-500">
              Enter JSON to validate
            </div>
          ) : !validationResult.errors ? (
            <div className="h-64 p-2 border rounded bg-green-50 overflow-auto">
              <div className="text-green-600 font-semibold mb-2">
                ✓ Valid JSON
              </div>
            </div>
          ) : (
            <div className="h-64 p-2 border rounded bg-red-50 overflow-auto">
              <div className="text-red-600 font-semibold mb-2">
                ✗ Invalid JSON
              </div>
              {validationResult.errors.map((error, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={index} className="mb-2 p-2 bg-red-100 rounded">
                  <strong>
                    {error.path ? `Path: ${error.path}` : "Error"}
                  </strong>
                  <div>{error.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
