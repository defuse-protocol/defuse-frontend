"use client"

import { MultiPayloadDeepSchema } from "@defuse-protocol/defuse-sdk"
import React, { useState } from "react"
import * as v from "valibot"

export default function JsonValidatorPage() {
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

  return (
    <div className="p-6 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Multipayload JSON Validator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Enter Multipayload JSON
          </h2>
          <textarea
            className="w-full h-64 p-2 border rounded font-mono"
            onChange={(e) => {
              validateJson(e.target.value)
            }}
            placeholder='{"name": "John Doe", "age": 30, ...}'
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
