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

  private async selectFromDropdown(
    dropdown: Locator,
    searchBar: Locator,
    listTestId: string,
    searchValue: string
  ) {
    await expect(dropdown).toBeVisible(shortTimeout)
    await dropdown.click()
    await expect(searchBar).toBeVisible(shortTimeout)
    await searchBar.fill(searchValue)
    const targetItem = this.page
      .getByTestId(listTestId)
      .getByRole("button", { name: searchValue })
    await expect(targetItem).toBeVisible(shortTimeout)
    await targetItem.click()
  }

  async selectAssetNetwork(searchNetwork: string) {
    await this.selectFromDropdown(
      this.selectNetworkSelectionDropdown,
      this.selectNetworkSearchBar,
      "network-list",
      searchNetwork
    )
  }

  async selectAssetToken(searchToken: string) {
    await this.selectFromDropdown(
      this.selectTokenSelectionDropdown,
      this.selectTokenSearchBar,
      "asset-list",
      searchToken
    )
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
