import { type Locator, type Page, expect } from "@playwright/test"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import {
  longTimeout,
  midTimeout,
  shortTimeout,
} from "../../helpers/constants/timeouts"
import { BasePage } from "./base.page"

export class TradePage extends BasePage {
  page: Page
  swapTabBtn: Locator
  otcTabBtn: Locator
  swapBtn: Locator
  otcSwapLinkBtn: Locator
  selectInputTokenSelectionDropdown: Locator
  selectOutputTokenSelectionDropdown: Locator
  selectTokenSearchBar: Locator
  swapInputField: Locator
  swapOutputField: Locator
  transactionCompleted: Locator
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
    this.page = page
    this.swapTabBtn = page.getByRole("link", { name: "Swap" })
    this.otcTabBtn = page.getByRole("link", { name: "OTC" })
    this.swapBtn = page.getByRole("button", { name: "Swap" })
    this.otcSwapLinkBtn = page.getByRole("button", { name: "Create swap link" })
    this.selectInputTokenSelectionDropdown = page
      .locator('button[data-sentry-component="SelectAssets"]')
      .first()

    this.selectOutputTokenSelectionDropdown = page
      .locator('button[data-sentry-component="SelectAssets"]')
      .last()

    this.selectTokenSearchBar = page.getByPlaceholder("Search coin")
    this.swapInputField = page.locator('input[name="amountIn"]')
    this.swapOutputField = page.locator('input[name="amountOut"]')
    this.transactionCompleted = page.getByText("Success")
    this.otcSellTokenSelectionDropdown = page
      .locator('button[data-sentry-component="SelectAssets"]')
      .first()
    this.otcBuyTokenSelectionDropdown = page
      .locator('button[data-sentry-component="SelectAssets"]')
      .last()

    this.insufficientBalanceBtn = page.getByRole("button", {
      name: "Insufficient Balance",
    })

    this.rejectedSignatureMessage = page.getByText(
      "It seems the message wasn’t signed in your wallet. Please try again"
    )

    this.rejectedOTCSignatureMessage = page.locator(
      'div[data-sentry-component="ErrorReason"]'
    )
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
  }

  async pressSwapButton() {
    await expect(this.swapBtn).toBeVisible(longTimeout)
    await expect(this.swapBtn).toBeEnabled(longTimeout)
    await this.swapBtn.click()
  }

  async pressCreateSwapLink() {
    await expect(this.otcSwapLinkBtn).toBeVisible(longTimeout)
    await expect(this.otcSwapLinkBtn).toBeEnabled(longTimeout)
    await this.otcSwapLinkBtn.click()
  }

  async selectFromToken(searchToken: string | null) {
    await expect(this.selectInputTokenSelectionDropdown).toBeVisible(
      shortTimeout
    )
    await this.selectInputTokenSelectionDropdown.click()

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
        .locator('div[data-sentry-component="AssetList"]')
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleTokens).toBeVisible(midTimeout)
      await allVisibleTokens.click()
    }
  }

  async selectToToken(searchToken: string | null) {
    await expect(this.selectOutputTokenSelectionDropdown).toBeVisible(
      shortTimeout
    )
    await this.selectOutputTokenSelectionDropdown.click()

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
        .locator('div[data-sentry-component="AssetList"]')
        .first()
        .getByRole("button")
        .first()
      await expect(allVisibleTokens).toBeVisible(midTimeout)
      await allVisibleTokens.click()
    }
  }

  async enterFromAmount(amount: number) {
    await expect(this.swapInputField).toBeVisible(shortTimeout)
    await this.swapInputField.fill(amount.toString())
  }

  async enterToAmount(amount: number) {
    await expect(this.swapOutputField).toBeVisible(shortTimeout)
    await this.swapOutputField.fill(amount.toString())
  }

  async confirmTransactionCompleted() {
    await expect(this.transactionCompleted).toBeVisible(longTimeout)
  }

  async waitForSwapCalculationToComplete() {
    await expect(this.swapOutputField).toHaveValue(/[0-9]/, longTimeout)
  }

  async selectSellToken(token: string | null) {
    await expect(this.otcSellTokenSelectionDropdown).toBeVisible(shortTimeout)
    await this.otcSellTokenSelectionDropdown.click()

    if (token) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(token)
      const targetToken = this.page
        .getByRole("button", {
          name: token,
        })
        .first()
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

  async selectBuyToken(token: string | null) {
    await expect(this.otcBuyTokenSelectionDropdown).toBeVisible(shortTimeout)
    await this.otcBuyTokenSelectionDropdown.click()

    if (token) {
      await expect(this.selectTokenSearchBar).toBeVisible(shortTimeout)
      await this.selectTokenSearchBar.fill(token)
      const targetToken = this.page
        .getByRole("button", {
          name: token,
        })
        .first()
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

  async confirmOrderWindowIsOpen() {
    await expect(this.orderConfirmationWindowText).toBeVisible(longTimeout)
    await expect(this.copyLinkBtn).toBeVisible(longTimeout)
    await expect(this.cancelOrderBtn).toBeVisible(longTimeout)
  }

  async confirmUserCanCopyLink() {
    await expect(this.copyLinkBtn).toBeVisible(longTimeout)
    await this.copyLinkBtn.click()
    // Get clipboard content after the link/button has been clicked
    const handle = await this.page.evaluateHandle(() =>
      navigator.clipboard.readText()
    )
    const clipboardContent = await handle.jsonValue()

    const pattern = /^https:\/\/near-intents\.org\/otc\/order#[A-Za-z0-9-_]+$/

    expect(clipboardContent).toMatch(pattern)
  }

  async closeOrderWindow() {
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
    const loc = this.page
      .locator('div[data-sentry-component="OtcMakerTradeItem"]')
      .first()

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
    const offerElem = this.page
      .locator('div[data-sentry-component="OtcMakerTradeItem"]')
      .first()
    await expect(offerElem).toBeVisible(midTimeout)

    const deleteBtn = offerElem.locator('button[data-accent-color="red"]')
    await expect(deleteBtn).toBeVisible(shortTimeout)
    await deleteBtn.click()

    await expect(this.cancelOTCOrderConfirm).toBeVisible(shortTimeout)
    await this.cancelOTCOrderConfirm.click()
  }

  async confirmOTCCancelled() {
    const offerElem = this.page.locator(
      'div[data-sentry-component="OtcMakerTradeItem"]'
    )
    await expect(offerElem).not.toBeVisible(shortTimeout)
  }
}
