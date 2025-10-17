import { type Locator, type Page, expect } from "@playwright/test"
import { longTimeout } from "../../helpers/constants/timeouts"

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

  async confirmCorrectPageLoaded(element: Locator) {
    await element.waitFor({ state: "visible", ...longTimeout })
  }

  async navigateToDepositPage() {
    await expect(
      this.depositTab,
      "Deposit tab button not visible"
    ).toBeVisible()

    await this.depositTab.click()
    await this.confirmCorrectPageLoaded(
      this.page.getByTestId("select-network-trigger")
    )
  }

  async navigateToTradePage() {
    await expect(this.tradeTab, "Trade tab button not visible").toBeVisible()

    await this.tradeTab.click()
    await this.confirmCorrectPageLoaded(
      this.page.getByTestId("select-assets-input")
    )
  }

  async navigateToAccountPage() {
    await expect(
      this.accountTab,
      "Account tab button not visible"
    ).toBeVisible()

    await this.accountTab.click()
    await this.confirmCorrectPageLoaded(
      this.page.getByTestId("withdraw-button")
    )
  }

  async waitForMetamaskAction() {
    // TODO: Find a better way to wait for metamask action
    await this.page.waitForTimeout(5_000)
  }
}
