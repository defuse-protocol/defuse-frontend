import { type Locator, type Page, expect } from "@playwright/test"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import {
  longTimeout,
  midTimeout,
  shortTimeout,
} from "../../helpers/constants/timeouts"
import { BasePage } from "./base.page"

export class TradePage extends BasePage {
  swapTabBtn: Locator
  otcTabBtn: Locator
  swapBtn: Locator
  otcSwapLinkBtn: Locator
  selectInputTokenSelectionDropdown: Locator
  selectOutputTokenSelectionDropdown: Locator
  selectTokenSearchBar: Locator
  swapInputField: Locator
  swapOutputField: Locator
  formSwitchTokensButton: Locator
  otcSellTokenSelectionDropdown: Locator
  otcBuyTokenSelectionDropdown: Locator
  insufficientBalanceBtn: Locator
  rejectedSignatureMessage: Locator
  rejectedOTCSignatureMessage: Locator
  otcCannotBeFilledField: Locator
  cancelOTCOrderConfirm: Locator
  copyLinkBtn: Locator
  cancelOrderBtn: Locator
  orderConfirmationWindowText: Locator

  constructor(page: Page) {
    super(page)
    this.swapTabBtn = page.getByRole("link", { name: "Swap" })
    this.otcTabBtn = page.getByRole("link", { name: "OTC" })
    this.swapBtn = page.getByRole("button", { name: "Swap" })
    this.otcSwapLinkBtn = page.getByRole("button", { name: "Create swap link" })
    this.selectInputTokenSelectionDropdown = page.getByTestId(
      "select-assets-input"
    )

    this.selectOutputTokenSelectionDropdown = page.getByTestId(
      "select-assets-output"
    )

    this.selectTokenSearchBar = page.getByPlaceholder("Search coin")
    this.swapInputField = page.locator('input[name="amountIn"]')
    this.swapOutputField = page.locator('input[name="amountOut"]')
    this.formSwitchTokensButton = page.getByTestId(
      "swap-form-switch-tokens-button"
    )
    this.otcSellTokenSelectionDropdown = page.getByTestId("select-assets-sell")
    this.otcBuyTokenSelectionDropdown = page.getByTestId("select-assets-buy")

    this.insufficientBalanceBtn = page.getByRole("button", {
      name: "Insufficient Balance",
    })

    this.rejectedSignatureMessage = page.getByText(
      "It seems the message wasn’t signed in your wallet. Please try again"
    )

    this.rejectedOTCSignatureMessage = page.getByTestId("error-reason")
    this.otcCannotBeFilledField = page.getByText(
      "The order cannot be filled. Your balance is incorrect. Please cancel the order"
    )

    this.cancelOTCOrderConfirm = page.getByRole("button", {
      name: "Cancel order",
    })
    this.copyLinkBtn = page.getByRole("button", { name: "Copy link" })
    this.cancelOrderBtn = page.getByRole("button", { name: "Cancel order" })
    this.orderConfirmationWindowText = page.getByRole("heading", {
      name: "Your order is open",
    })
  }

  async confirmTradePageLoaded() {
    await expect(this.page).toHaveURL(`${NEAR_INTENTS_PAGE.baseURL}`)
  }

  async switchToSwap() {
    await expect(this.swapTabBtn).toBeVisible(midTimeout)
    await this.swapTabBtn.click()
  }

  async switchToOTC() {
    await expect(this.otcTabBtn).toBeVisible(midTimeout)
    await this.otcTabBtn.click()
    await this.confirmCorrectPageLoaded(this.otcSellTokenSelectionDropdown)
  }

  async pressSwapButton() {
    await expect(this.swapBtn).toBeVisible(longTimeout)
    await expect(this.swapBtn).toBeEnabled(longTimeout)
    await this.swapBtn.click()

    const confirmNewPriceBtn = this.page.getByTestId("confirm-new-price-button")
    const isConfirmNewPriceVisible =
      await confirmNewPriceBtn.isVisible(longTimeout)

    if (isConfirmNewPriceVisible) {
      await confirmNewPriceBtn.click()
    }
  }

  async pressCreateSwapLink() {
    await expect(this.otcSwapLinkBtn).toBeVisible(longTimeout)
    await expect(this.otcSwapLinkBtn).toBeEnabled(longTimeout)
    await this.otcSwapLinkBtn.click()
  }

  private async selectToken(
    dropdownLocator: Locator,
    searchToken: string | null
  ) {
    await expect(dropdownLocator).toBeVisible(shortTimeout)
    await dropdownLocator.click()

    if (searchToken) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(searchToken)
      const targetToken = this.page
        .getByRole("button", {
          name: searchToken,
        })
        .first()
      await expect(targetToken).toBeVisible(shortTimeout)
      await targetToken.click()
    } else {
      const allVisibleTokens = this.page
        .getByTestId("asset-list")
        .getByRole("button")
        .first()
      await expect(allVisibleTokens).toBeVisible(midTimeout)
      await allVisibleTokens.click()
    }
  }

  async selectFromToken(searchToken: string | null) {
    await this.selectToken(this.selectInputTokenSelectionDropdown, searchToken)
  }

  async selectToToken(searchToken: string | null) {
    await this.selectToken(this.selectOutputTokenSelectionDropdown, searchToken)
  }

  async enterFromAmount(amount: number) {
    await expect(this.swapInputField).toBeVisible(shortTimeout)
    await this.swapInputField.fill(amount.toString())
  }

  async enterToAmount(amount: number) {
    await expect(this.swapOutputField).toBeVisible(shortTimeout)
    await this.swapOutputField.fill(amount.toString())
  }

  async pressFormSwitchTokensButton() {
    await expect(this.formSwitchTokensButton).toBeVisible(shortTimeout)
    await this.formSwitchTokensButton.click()
  }

  async confirmTransactionCompleted(count = 1) {
    const elements = this.page.getByTestId("swap-success")
    await expect(elements).toHaveCount(count, longTimeout)
  }

  async waitForSwapCalculationToComplete() {
    await expect(this.swapOutputField).toHaveValue(/^\d+(\.\d+)?$/, longTimeout)
  }

  async selectSellToken(token: string | null) {
    await this.selectToken(this.otcSellTokenSelectionDropdown, token)
  }

  async selectBuyToken(token: string | null) {
    await this.selectToken(this.otcBuyTokenSelectionDropdown, token)
  }

  async confirmOrderWindowIsOpen() {
    await expect(this.orderConfirmationWindowText).toBeVisible(longTimeout)
    await expect(this.copyLinkBtn).toBeVisible(longTimeout)
    await expect(this.cancelOrderBtn).toBeVisible(longTimeout)
  }

  async confirmUserCanCopyLink() {
    await expect(this.copyLinkBtn).toBeVisible(longTimeout)
    await this.copyLinkBtn.click()
    // Get clipboard content after the link/button has been clicked
    const clipboardContent = await this.page.evaluate(() =>
      navigator.clipboard.readText()
    )

    expect(clipboardContent).toContain(
      `${NEAR_INTENTS_PAGE.baseURL}/otc/order#`
    )
  }

  async closeOrderWindow() {
    // TODO: use better, more specific selector then .first()
    const closeBtn = this.page.getByRole("button").first()
    await expect(closeBtn).toBeVisible(midTimeout)
    await closeBtn.click()
  }

  async confirmOTCCreated(options: {
    sellAmount: number
    sellToken: string
    buyAmount: number
    buyToken: string
  }) {
    const { sellAmount, sellToken, buyAmount, buyToken } = options
    const loc = this.page.getByTestId("otc-maker-trade-item").first()

    const type = loc.locator("div.flex-col").locator("div").first()
    const swapDetails = loc.locator("div.flex-col").locator("div").last()

    const typeTextRaw = await type.innerText()
    const swapDetailsText = await swapDetails.innerText()
    const typeText = typeTextRaw.split("\n")[0]
    expect(typeText).toStrictEqual("Swap")
    const tokens = swapDetailsText
      .replace("→", " ")
      .split(/\s+/)
      .filter((tok) => /^\d+(\.\d+)?$/.test(tok) || /^[A-Z]+$/.test(tok))

    expect(Number(tokens[0])).toEqual(sellAmount)
    expect(tokens[1]).toEqual(sellToken.toUpperCase())
    expect(Number(tokens[2])).toEqual(buyAmount)
    expect(tokens[3]).toEqual(buyToken.toUpperCase())
  }

  async confirmInsufficientBalance() {
    await expect(this.insufficientBalanceBtn).toBeVisible(longTimeout)
    await expect(this.insufficientBalanceBtn).toBeDisabled()
  }

  async confirmUserRejectedSignature() {
    await expect(this.rejectedSignatureMessage).toBeVisible(longTimeout)
  }

  async confirmOTCRejectedSignature() {
    await expect(this.rejectedOTCSignatureMessage).toBeVisible(longTimeout)
    await expect(this.rejectedOTCSignatureMessage).toHaveText(
      "ERR_USER_DIDNT_SIGN"
    )
  }

  async confirmOrderCannotBeFilled() {
    await expect(this.otcCannotBeFilledField).toBeVisible(midTimeout)
  }

  async removeCreatedOTCOffer() {
    const offerElem = this.page.getByTestId("otc-maker-trade-item").first()
    await expect(offerElem).toBeVisible(midTimeout)

    const deleteBtn = offerElem.locator('button[data-accent-color="red"]')
    await expect(deleteBtn).toBeVisible(shortTimeout)
    await deleteBtn.click()

    await expect(this.cancelOTCOrderConfirm).toBeVisible(shortTimeout)
    await this.cancelOTCOrderConfirm.click()
  }

  async confirmOTCCancelled() {
    const offerElem = this.page.getByTestId("otc-maker-trade-item")
    await expect(offerElem).not.toBeVisible(shortTimeout)
  }
}
