import { INTENTS_API_KEY, INTENTS_ENV } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"

const TIMEOUT_MS = 30_000

export async function POST(request: Request) {
  try {
    const headers: Record<string, string> = {}
    if (INTENTS_API_KEY) {
      headers.Authorization = `Bearer ${INTENTS_API_KEY}`
    }

    const rpcMethod = new URL(request.url).searchParams.get("method")

    const upstreamResponse = await fetch(
      INTENTS_ENV === "production"
        ? `https://solver-relay-v2.chaindefuser.com/rpc?method=${rpcMethod}`
        : `https://solver-relay-stage.intents-near.org/rpc?method=${rpcMethod}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: request.body,
        // @ts-ignore
        duplex: "half", // Required for streaming request bodies
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )

    // Create response headers properly
    const responseHeaders = new Headers()

    // Copy specific headers from upstream response
    upstreamResponse.headers.forEach((value, key) => {
      // Skip headers that Next.js will set automatically
      if (
        !["content-encoding", "content-length", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    logger.error(err)

    // Generic error without ID (since we didn't parse the body)
    let statusCode = 500
    let errorMessage = "Internal server error"
    let errorCode = -32603

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        statusCode = 504
        errorMessage = "Request timeout"
        errorCode = -32000
      }
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: errorCode,
          message: errorMessage,
        },
      },
      { status: statusCode }
    )
  }
}
