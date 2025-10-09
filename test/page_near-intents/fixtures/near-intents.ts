import { expect } from "@playwright/test"
import { testWithSynpress } from "@synthetixio/synpress"
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright"

import {
  longTimeout,
  midTimeout,
  shortTimeout,
} from "../../helpers/constants/timeouts"
import { waitForMetaMaskPage } from "../../helpers/functions/helper-functions"
import nearWeb3ProdSetup from "../../wallet-setup/near-web3-prod.setup"

export const test = testWithSynpress(
  metaMaskFixtures(nearWeb3ProdSetup)
).extend<{
  nearIntentsPreconditions: {
    loginToNearIntents: () => Promise<void>
    loginToNearIntentsAccount: (accountString: string) => Promise<void>
    isSignatureCheckRequired: () => Promise<void>
    waitForAccountSync: () => Promise<void>
  }
}>({
  nearIntentsPreconditions: async ({ page, context, extensionId }, use) => {
    const metamask = new MetaMask(
      context,
      page,
      nearWeb3ProdSetup.walletPassword,
      extensionId
    )

    const signInButton = page
      .getByRole("banner")
      .getByRole("button", { name: "Sign in" })

    const metamaskButton = page.getByRole("button", {
      name: "MetaMask MetaMask",
    })

    const signatureCheckRequiredPopup = page.getByLabel(
      "Signature Check Required"
    )

    const checkCompatibility = page.getByRole("button", {
      name: "Check Compatibility",
    })

    const accountTypeDropdown = page.locator(
      "div[data-radix-popper-content-wrapper]"
    )

    const loginToNearIntents = async () => {
      let messageOnFail = '"Sign in" button is not visible'
      await expect(signInButton, messageOnFail).toBeVisible(shortTimeout)
      await expect(signInButton, messageOnFail).toBeEnabled(shortTimeout)
      await signInButton.click()

      await expect(accountTypeDropdown).toBeVisible(midTimeout)

      messageOnFail = "MetaMask login option is not visible in pop up"
      await expect(metamaskButton, messageOnFail).toBeVisible(shortTimeout)
      await expect(metamaskButton, messageOnFail).toBeEnabled(shortTimeout)
      await metamaskButton.click()

      await metamask.connectToDapp()
    }

    const loginToNearIntentsAccount = async (accountString: string) => {
      let messageOnFail = '"Sign in" button is not visible'
      await expect(signInButton, messageOnFail).toBeVisible(shortTimeout)
      await signInButton.click()

      messageOnFail = "MetaMask login option is not visible in pop up"
      await expect(metamaskButton, messageOnFail).toBeVisible(shortTimeout)
      await metamaskButton.click()

      await metamask.connectToDapp([accountString])
    }

    const isSignatureCheckRequired = async () => {
      await expect(signatureCheckRequiredPopup).toBeVisible(shortTimeout)
      await expect(checkCompatibility).toBeVisible(shortTimeout)
      await expect(checkCompatibility).toBeEnabled(shortTimeout)
      await checkCompatibility.click()
      await waitForMetaMaskPage(context)
      await metamask.confirmSignature()
    }

    const getAccountAddress = async (
      opts = { timeout: 5000, polling: 200 }
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
      const accountIndicator = page
        .locator('div[data-sentry-component="ConnectWallet"]')
        .getByRole("button")
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
      loginToNearIntentsAccount,
      isSignatureCheckRequired,
      waitForAccountSync,
    })
  },
})
