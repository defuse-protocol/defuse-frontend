import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

export const TEST_BASE_URL = "http://localhost:3000"
export const server = setupServer()

// Browser fetch doesn't need to know the hostname, it fallbacks to the current origin,
// but in tests we need to explicitly set the hostname, becuase they run in nodejs
global.process.env.NEXT_PUBLIC_BASE_URL = TEST_BASE_URL

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
