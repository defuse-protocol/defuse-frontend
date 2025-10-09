import { type Locator, type Page, expect } from "@playwright/test"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import {
  longTimeout,
  midTimeout,
  shortTimeout,
} from "../../helpers/constants/timeouts"
import { BasePage } from "./base.page"

export class AccountPage extends BasePage {
  page: Page
  withdrawBtn: Locator
  selectTokenSelectionDropdown: Locator
  selectTokenSearchBar: Locator
  selectWithdrawTokenSearchBar: Locator
  withdrawAmountField: Locator
  withdrawTargetNetwork: Locator
  withdrawTargetAccountField: Locator
  withdrawConfirmBtn: Locator
  withdrawInsufficientBalanceField: Locator
  rejectedSignatureMessage: Locator

  constructor(page: Page) {
    super(page)
    this.page = page
    this.withdrawBtn = page.getByLabel("Withdraw")
    this.selectTokenSelectionDropdown = page.locator(
      'button[data-sentry-component="SelectAssets"]'
    )
    this.selectTokenSearchBar = page.getByPlaceholder("Search")
    this.withdrawAmountField = page.getByPlaceholder("0")
    this.withdrawTargetNetwork = page.locator(
      'button[data-sentry-component="SelectTriggerLike"]'
    )
    this.withdrawTargetAccountField = page.getByPlaceholder(
      "Enter wallet address"
    )
    this.withdrawConfirmBtn = page.getByRole("button", { name: "Withdraw" })
    this.withdrawInsufficientBalanceField = page.getByText(
      "Insufficient balance"
    )
    this.rejectedSignatureMessage = page.getByText(
      "It seems the message wasn’t signed in your wallet. Please try again"
    )
    this.selectWithdrawTokenSearchBar = page.getByPlaceholder("Search coin")
  }

  async confirmAccountPageLoaded() {
    await expect(this.page).toHaveURL(`${NEAR_INTENTS_PAGE.baseURL}/account`)
  }

  async pressAccountsBtn() {
    await expect(this.withdrawBtn).toBeVisible(midTimeout)
    await this.withdrawBtn.click()
  }

  async selectToken(token: string, searchNetwork = true) {
    await expect(this.selectTokenSelectionDropdown).toBeVisible(shortTimeout)
    await this.selectTokenSelectionDropdown.click()

    if (searchNetwork) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(token)
      const targetNetwork = this.page
        .locator('div[data-sentry-component="AssetList"]')
        .getByRole("button")
        .first()
      await expect(targetNetwork).toBeVisible(shortTimeout)
      await targetNetwork.click()
    } else {
      const allVisibleNetworks = this.page
        .locator('div[data-sentry-component="AssetList"]')
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleNetworks).toBeVisible(midTimeout)
      await allVisibleNetworks.click()
    }
  }

  async selectWithdrawToken(searchToken: string | null) {
    await expect(this.selectTokenSelectionDropdown).toBeVisible(shortTimeout)
    await this.selectTokenSelectionDropdown.click()

    if (searchToken) {
      await expect(this.selectWithdrawTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectWithdrawTokenSearchBar.fill(searchToken)
      const targetToken = this.page.getByRole("button", {
        name: searchToken,
      })
      await expect(targetToken).toBeVisible(shortTimeout)
      await targetToken.click()
    } else {
      const allVisibleTokens = this.page
        .locator('div[data-sentry-component="AssetList"]')
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleTokens).toBeVisible(midTimeout)
      await allVisibleTokens.click()
    }
  }

  async enterAmount(value: number) {
    await expect(this.withdrawAmountField).toBeVisible(shortTimeout)
    await this.withdrawAmountField.fill(value.toString())
  }

  async selectTargetNetwork(network: string) {
    await expect(this.withdrawTargetNetwork).toBeVisible(shortTimeout)
    await this.withdrawTargetNetwork.click()

    if (network) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(network)
      const targetNetwork = this.page
        .locator('div[data-sentry-component="NetworkList"]')
        .getByRole("button")
        .first()
      await expect(targetNetwork).toBeVisible(shortTimeout)
      await targetNetwork.click()
    } else {
      const allVisibleNetworks = this.page
        .locator('div[data-sentry-component="NetworkList"]')
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleNetworks).toBeVisible(midTimeout)
      await allVisibleNetworks.click()
    }
  }

  async enterTargetAccount(account: string) {
    await expect(this.withdrawTargetAccountField).toBeVisible(midTimeout)
    await this.withdrawTargetAccountField.fill(account)
  }

  async confirmWithdrawal() {
    await expect(this.withdrawConfirmBtn).toBeVisible(midTimeout)
    await this.withdrawConfirmBtn.click()
  }

  async confirmWithdrawalState(state: string) {
    const txState = this.page.getByText(state)
    await expect(txState).toBeVisible(midTimeout)
  }

  async confirmWithdrawInsufficientBalance() {
    await expect(this.withdrawInsufficientBalanceField).toBeVisible(midTimeout)
  }

  async confirmTransactionCancelled() {
    await expect(this.rejectedSignatureMessage).toBeVisible(longTimeout)
  }
}
