import { type Page, expect } from "@playwright/test"
import { test as base } from "@playwright/test"
import {
  type Web3ProviderBackend,
  Web3RequestKind,
  injectHeadlessWeb3Provider,
} from "headless-web3-provider"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import { longTimeout, shortTimeout } from "../../helpers/constants/timeouts"
import { getSeedPhrase } from "../../helpers/functions/system-variables"

export const test = base
  .extend<{
    signers: string[]
    injectWeb3Provider: (page: Page) => Promise<Web3ProviderBackend>
  }>({
    // signers - the private keys that are to be used in the tests
    signers: [getSeedPhrase()],

    // injectWeb3Provider - function that injects web3 provider instance into the page
    injectWeb3Provider: async ({ signers }, use) => {
      await use((page, privateKeys = signers) =>
        injectHeadlessWeb3Provider(
          page,
          privateKeys,
          31337, // Chain ID - 31337 is common testnet id
          "http://localhost:8545" // Ethereum client's JSON-RPC URL
        )
      )
    },
  })
  .extend<{
    nearIntentsPreconditions: {
      loginToNearIntents: () => Promise<void>
      isSignatureCheckRequired: () => Promise<void>
      waitForAccountSync: () => Promise<void>
      getAccountAddress: (opts?: {
        timeout?: number
        polling?: number
      }) => Promise<string>
    }
  }>({
    nearIntentsPreconditions: async (
      { page, context, injectWeb3Provider },
      use
    ) => {
      // Grant clipboard permissions
      await context.grantPermissions(["clipboard-read", "clipboard-write"], {
        origin: NEAR_INTENTS_PAGE.baseURL,
      })

      const signInButton = page.getByTestId("sign-in-button")

      const metamaskButton = page.getByRole("button", {
        name: "MetaMask MetaMask",
      })

      const signatureCheckRequiredPopup = page.getByLabel(
        "Signature Check Required"
      )

      const checkCompatibility = page.getByRole("button", {
        name: "Check Compatibility",
      })

      const loginToNearIntents = async () => {
        const wallet = await injectWeb3Provider(page)
        let messageOnFail = '"Sign in" button is not visible'
        await expect(signInButton, messageOnFail).toBeVisible(shortTimeout)
        await expect(signInButton, messageOnFail).toBeEnabled(shortTimeout)
        await signInButton.click()

        messageOnFail = "MetaMask login option is not visible in pop up"
        await expect(metamaskButton, messageOnFail).toBeVisible(shortTimeout)
        await expect(metamaskButton, messageOnFail).toBeEnabled(shortTimeout)
        await metamaskButton.click()

        await wallet.authorize(Web3RequestKind.RequestAccounts)
      }

      const isSignatureCheckRequired = async () => {
        const wallet = await injectWeb3Provider(page)

        await expect(signatureCheckRequiredPopup).toBeVisible(shortTimeout)
        await expect(checkCompatibility).toBeVisible(shortTimeout)
        await expect(checkCompatibility).toBeEnabled(shortTimeout)
        await checkCompatibility.click()
        await wallet.authorize(Web3RequestKind.SignTypedData)
      }

      const getAccountAddress = async (
        opts: { timeout?: number; polling?: number } = {
          timeout: 5000,
          polling: 200,
        }
      ) => {
        const { timeout, polling } = opts

        const address = await page.waitForFunction(
          () => {
            if (
              !window.ethereum ||
              typeof window.ethereum.request !== "function"
            ) {
              return null
            }

            return window.ethereum
              .request({ method: "eth_accounts" })
              .then((accounts: string[]) => {
                return accounts?.length ? accounts[0] : null
              })
              .catch(() => null)
          },
          { timeout, polling }
        )

        const currentAddress = await address.jsonValue()

        if (currentAddress) {
          return String(currentAddress).toLowerCase()
        }

        return ""
      }

      const waitForAccountSync = async (
        opts = { timeout: 5000, polling: 200 }
      ) => {
        const accountIndicator = page.getByTestId("account-indicator")
        await expect(accountIndicator).toBeVisible(longTimeout)

        const currentAddress = await getAccountAddress(opts)

        const truncatedAddress = currentAddress.substring(0, 4)

        const uiAccountIndicator = await accountIndicator.innerText()
        expect(
          uiAccountIndicator.toLocaleLowerCase().startsWith(truncatedAddress)
        ).toBeTruthy()

        await page.waitForTimeout(1_000)
      }

      await use({
        loginToNearIntents,
        isSignatureCheckRequired,
        waitForAccountSync,
        getAccountAddress,
      })
    },
  })
