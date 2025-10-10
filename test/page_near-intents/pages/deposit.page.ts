import { type Locator, type Page, expect } from "@playwright/test"
import {
  longTimeout,
  midTimeout,
  shortTimeout,
} from "../../helpers/constants/timeouts"
import { BasePage } from "./base.page"

export class DepositPage extends BasePage {
  selectNetworkSelectionDropdown: Locator
  selectNetworkSearchBar: Locator
  selectTokenSelectionDropdown: Locator
  selectTokenSearchBar: Locator
  depositInputField: Locator
  depositBtn: Locator
  transactionCompleted: Locator
  insufficientBalanceBtn: Locator
  withdrawInsufficientBalanceField: Locator
  rejectedSignatureMessage: Locator

  constructor(page: Page) {
    super(page)
    this.selectNetworkSelectionDropdown = page.getByTestId(
      "select-network-trigger"
    )
    this.selectNetworkSearchBar = page.getByPlaceholder("Search")
    this.selectTokenSelectionDropdown = page.getByTestId("select-deposit-asset")

    this.selectTokenSearchBar = page.getByPlaceholder("Search")
    this.depositInputField = page.getByPlaceholder("0")
    this.depositBtn = page
      .getByRole("main")
      .getByRole("button", { name: "Deposit" })

    this.transactionCompleted = page.getByText("Completed")
    this.insufficientBalanceBtn = page.getByRole("button", {
      name: "Insufficient Balance",
    })
    this.withdrawInsufficientBalanceField = page.getByText(
      "Insufficient balance"
    )
    this.rejectedSignatureMessage = page.getByText(
      "It seems the transaction was rejected in your wallet. Please try again."
    )
  }

  async selectAssetNetwork(searchNetwork: string | null) {
    await expect(this.selectNetworkSelectionDropdown).toBeVisible(shortTimeout)
    await this.selectNetworkSelectionDropdown.click()

    if (searchNetwork) {
      await expect(this.selectNetworkSearchBar).toBeVisible(shortTimeout)
      await this.selectNetworkSearchBar.fill(searchNetwork)
      const targetNetwork = this.page
        .getByTestId("network-list")
        .getByRole("button")
        .first()
      await expect(targetNetwork).toBeVisible(shortTimeout)
      await targetNetwork.click()
    } else {
      const allVisibleNetworks = this.page
        .getByTestId("network-list")
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleNetworks).toBeVisible(midTimeout)
      await allVisibleNetworks.click()
    }
  }

  async selectAssetToken(searchToken: string | null) {
    await expect(this.selectTokenSelectionDropdown).toBeVisible(shortTimeout)
    await this.selectTokenSelectionDropdown.click()

    if (searchToken) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(searchToken)
      const targetToken = this.page.getByRole("button", {
        name: searchToken,
      })
      await expect(targetToken).toBeVisible(shortTimeout)
      await targetToken.click()
    } else {
      const allVisibleTokens = this.page
        .getByTestId("asset-list")
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleTokens).toBeVisible(midTimeout)
      await allVisibleTokens.click()
    }
  }

  async enterDepositValue(value: number) {
    await expect(this.depositInputField).toBeVisible(shortTimeout)
    await this.depositInputField.fill(value.toString())
  }

  async clickDeposit() {
    await expect(this.depositBtn).toBeVisible(midTimeout)
    await expect(this.depositBtn).toBeEnabled(midTimeout)
    // TODO: Find a better way to wait for deposit button to be clickable
    await this.page.waitForTimeout(1_000)
    await this.depositBtn.click()
  }

  async isTransactionCompleted(): Promise<boolean> {
    const result = await this.transactionCompleted.isVisible()

    return result
  }

  async isTransactionProcessing(): Promise<boolean> {
    const result = await this.page.getByText("Pending").isVisible()

    return result
  }

  async confirmTransactionCompleted() {
    await expect(this.transactionCompleted).toBeVisible(longTimeout)
  }

  async confirmInsufficientBalance() {
    await expect(this.insufficientBalanceBtn).toBeVisible(midTimeout)
  }

  async confirmTransactionCancelled() {
    await expect(this.rejectedSignatureMessage).toBeVisible(longTimeout)
  }
}
