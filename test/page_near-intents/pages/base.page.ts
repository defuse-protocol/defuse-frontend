import { type Locator, type Page, expect } from "@playwright/test"
import { shortTimeout } from "../../helpers/constants/timeouts"

export class BasePage {
  page: Page
  nearIntentsLogo: Locator
  depositTab: Locator
  tradeTab: Locator
  accountTab: Locator

  constructor(page: Page) {
    this.page = page
    this.nearIntentsLogo = page.getByAltText("Near Intent Logo")
    this.depositTab = page.getByTestId("deposit-tab")
    this.tradeTab = page.getByTestId("trade-tab")
    this.accountTab = page.getByTestId("account-tab")
  }

  async clickAndConfirmCorrectPageLoaded(
    elementToClick: Locator,
    elementToExpect: Locator
  ) {
    for (let i = 0; i < 2; i++) {
      try {
        await elementToClick.click()
        await elementToExpect.waitFor({ state: "visible", ...shortTimeout })
        return
      } catch (e) {
        if (i === 1) {
          throw e
        }
      }
    }
  }

  async navigateToDepositPage() {
    await expect(
      this.depositTab,
      "Deposit tab button not visible"
    ).toBeVisible()

    await this.clickAndConfirmCorrectPageLoaded(
      this.depositTab,
      this.page.getByTestId("select-network-trigger")
    )
  }

  async navigateToTradePage() {
    await expect(this.tradeTab, "Trade tab button not visible").toBeVisible()

    await this.clickAndConfirmCorrectPageLoaded(
      this.tradeTab,
      this.page.getByTestId("select-assets-input")
    )
  }

  async navigateToAccountPage() {
    await expect(
      this.accountTab,
      "Account tab button not visible"
    ).toBeVisible()

    await this.clickAndConfirmCorrectPageLoaded(
      this.accountTab,
      this.page.getByTestId("withdraw-button")
    )
  }

  async waitForMetamaskAction() {
    // TODO: Find a better way to wait for metamask action
    await this.page.waitForTimeout(5_000)
  }
}
