import { TEST_BASE_URL, server } from "@src/tests/setup"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import {
  createWebauthnCredential,
  getWebauthnCredential,
} from "./webAuthnCredentialsAPI"

describe("webauthnCredentials", () => {
  describe("createWebauthnCredential", () => {
    it("should create credential successfully", async () => {
      server.use(
        http.post(`${TEST_BASE_URL}/api/webauthn_credentials`, async () => {
          return HttpResponse.json({ success: true }, { status: 201 })
        })
      )

      const result = await createWebauthnCredential({
        raw_id: "5VJs8P7bXCgYo1HhVnwuVQ",
        public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
        hostname: "localhost",
      })

      expect(result).toEqual({ success: true })
    })

    it("should throw error on failure", async () => {
      server.use(
        http.post(`${TEST_BASE_URL}/api/webauthn_credentials`, async () => {
          return HttpResponse.json(
            { error: "Failed to create" },
            { status: 500 }
          )
        })
      )

      await expect(
        createWebauthnCredential({
          raw_id: "5VJs8P7bXCgYo1HhVnwuVQ",
          public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
          hostname: "localhost",
        })
      ).rejects.toThrow("Failed to create")
    })
  })

  describe("getWebauthnCredential", () => {
    it("should get credential successfully", async () => {
      server.use(
        http.get(
          `${TEST_BASE_URL}/api/webauthn_credentials/:rawId`,
          async () => {
            return HttpResponse.json({
              public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
              hostname: "near-intents.org",
            })
          }
        )
      )

      const result = await getWebauthnCredential("5VJs8P7bXCgYo1HhVnwuVQ")
      expect(result).toEqual({
        public_key: "2Kc5WSg4kBsxQXBuBPjEH9",
        hostname: "near-intents.org",
      })
    })

    it("should throw error on failure", async () => {
      server.use(
        http.get(
          `${TEST_BASE_URL}/api/webauthn_credentials/:rawId`,
          async () => {
            return HttpResponse.json({ error: "Not found" }, { status: 404 })
          }
        )
      )

      await expect(
        getWebauthnCredential("5VJs8P7bXCgYo1HhVnwuVQ")
      ).rejects.toThrow("Not found")
    })
  })
})
