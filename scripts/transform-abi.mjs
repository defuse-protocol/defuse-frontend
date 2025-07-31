#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

function transformAbi(inputPath) {
  try {
    // Read the input JSON file
    const jsonData = JSON.parse(readFileSync(inputPath, "utf8"))

    // Extract the root_schema from body
    const rootSchema = jsonData.body.root_schema

    if (!rootSchema) {
      throw new Error("root_schema not found in body")
    }

    // Remove the type field using destructuring to avoid delete operator
    const { type: _, ...schemaWithoutType } = rootSchema

    // Set the new title
    const transformedSchema = {
      ...schemaWithoutType,
      title: "Defuse Contract ABI",
    }

    // Output the transformed schema to stdout
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.log(JSON.stringify(transformedSchema, null, 2))
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error("Error transforming ABI:", error.message)
    process.exit(1)
  }
}

// Get input file path from command line argument
const inputPath = process.argv[2]

if (!inputPath) {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.error("Usage: node transform-abi.mjs <input-json-file>")
  process.exit(1)
}

// Check if file exists
if (!existsSync(inputPath)) {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.error(`File not found: ${inputPath}`)
  process.exit(1)
}

transformAbi(inputPath)
