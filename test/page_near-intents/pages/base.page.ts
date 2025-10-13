import { type Locator, type Page, expect } from "@playwright/test"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import { midTimeout } from "../../helpers/constants/timeouts"

export class BasePage {
  page: Page
  nearIntentsLogo: Locator
  depositTab: Locator
  tradeTab: Locator
  accountTab: Locator

  constructor(page: Page) {
    this.page = page
    this.nearIntentsLogo = page.getByAltText("Near Intent Logo")
    this.depositTab = page.getByRole("button", { name: "Deposit" })
    this.tradeTab = page.getByRole("link", { name: "Trade" })
    this.accountTab = page.getByRole("link", { name: "Account" })
  }

  async confirmCorrectPageLoaded(url: string) {
    const messageOnFail: string = `Loaded page is not ${url}`
    const expectedUrl = `${NEAR_INTENTS_PAGE.baseURL}${url}`
    await this.page.waitForLoadState("domcontentloaded")
    await this.waitForUrl(expectedUrl)
    await expect(this.page, messageOnFail).toHaveURL(expectedUrl)
    await this.page.waitForLoadState("networkidle")
  }

  async clickNearIntentsLogo() {
    const url: string = "/dashboard"
    await expect(
      this.nearIntentsLogo,
      "Near-Intents logo not visible"
    ).toBeVisible()
    await this.nearIntentsLogo.click()
    await this.confirmCorrectPageLoaded(url)
  }

  async navigateToDepositPage() {
    const url: string = "/deposit"
    await expect(
      this.depositTab,
      "Deposit tab button not visible"
    ).toBeVisible()

    await this.depositTab.click()
    await this.confirmCorrectPageLoaded(url)
  }

  async navigateToTradePage() {
    const url: string = ""
    await expect(this.tradeTab, "Trade tab button not visible").toBeVisible()

    await this.tradeTab.click()
    await this.confirmCorrectPageLoaded(url)
  }

  async navigateToAccountPage() {
    const url: string = "/account"
    await expect(
      this.accountTab,
      "Account tab button not visible"
    ).toBeVisible()

    await this.accountTab.click()
    await this.confirmCorrectPageLoaded(url)
  }

  async waitForMetamaskAction() {
    // TODO: Find a better way to wait for metamask action
    await this.page.waitForTimeout(5_000)
  }

  async waitForStableElement() {
    // TODO: Find a better way to wait for stable element
    await this.page.waitForTimeout(1_000)
  }

  /**
   * Robust URL waiting mechanism that handles CI environment quirks
   * @param expectedUrl - The expected URL to wait for
   * @param timeout - Optional timeout override
   */
  private async waitForUrl(expectedUrl: string, timeout = midTimeout.timeout) {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        const currentUrl = this.page.url()

        if (currentUrl === expectedUrl) {
          return
        }

        const urlPath = new URL(currentUrl).pathname
        const expectedPath = new URL(expectedUrl).pathname

        if (urlPath === expectedPath) {
          return
        }

        await this.page.waitForTimeout(100)
      } catch {
        await this.page.waitForTimeout(100)
      }
    }

    throw new Error(
      `Timeout waiting for URL: ${expectedUrl}. Current URL: ${this.page.url()}`
    )
  }
}
