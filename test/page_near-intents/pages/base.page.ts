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

  async confirmCorrectPageLoaded(page: Page, url: string) {
    const messageOnFail: string = `Loaded page is not ${url}`
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForURL(`${NEAR_INTENTS_PAGE.baseURL}${url}`, midTimeout)
    await expect(page, messageOnFail).toHaveURL(
      `${NEAR_INTENTS_PAGE.baseURL}${url}`
    )

    await page.waitForLoadState()
  }

  async clickNearIntentsLogo() {
    const url: string = "/dashboard"
    await expect(
      this.nearIntentsLogo,
      "Near-Intents logo not visible"
    ).toBeVisible()
    await this.nearIntentsLogo.click()
    await this.confirmCorrectPageLoaded(this.page, url)
  }

  async navigateToDepositPage() {
    const url: string = "/deposit"
    await expect(
      this.depositTab,
      "Deposit tab button not visible"
    ).toBeVisible()

    await this.depositTab.click()
    await this.confirmCorrectPageLoaded(this.page, url)
  }

  async navigateToTradePage() {
    const url: string = ""
    await expect(this.tradeTab, "Trade tab button not visible").toBeVisible()

    await this.tradeTab.click()
    await this.confirmCorrectPageLoaded(this.page, url)
  }

  async navigateToAccountPage() {
    const url: string = "/account"
    await expect(
      this.accountTab,
      "Account tab button not visible"
    ).toBeVisible()

    await this.accountTab.click()
    await this.confirmCorrectPageLoaded(this.page, url)
  }

  async waitForMetamaskAction() {
    await this.page.waitForTimeout(5_000)
  }

  async waitForStableElement() {
    await this.page.waitForTimeout(1_000)
  }
}
