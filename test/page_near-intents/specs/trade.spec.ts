import { Web3RequestKind } from "headless-web3-provider"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import {
  NEAR_INTENTS_TAG,
  NEAR_INTENTS_TAG_OTC,
  NEAR_INTENTS_TAG_SWAP,
} from "../../helpers/constants/tags"
import { test } from "../fixtures/near-intents"
import { HomePage } from "../pages/home.page"
import { TradePage } from "../pages/trade.page"

test.use(NEAR_INTENTS_PAGE)

test.beforeEach(
  "Login to Near Web3 wallet with MetaMask",
  async ({ page, nearIntentsPreconditions }) => {
    await page.goto(NEAR_INTENTS_PAGE.baseURL)
    await nearIntentsPreconditions.loginToNearIntents()
    await nearIntentsPreconditions.isSignatureCheckRequired()
  }
)

test.describe(
  "NEAR Intents Wallet: Swapping",
  { tag: [NEAR_INTENTS_TAG, NEAR_INTENTS_TAG_SWAP] },
  () => {
    test("Confirm that user cannot swap more than the available balance", async ({
      page,
    }) => {
      const amount = 100000
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToSwap()
      await tradePage.selectFromToken("Turbo")
      await tradePage.selectToToken("Near")
      await tradePage.enterFromAmount(amount)
      await tradePage.confirmInsufficientBalance()
    })

    test("Confirm user can swap", async ({ page, injectWeb3Provider }) => {
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToSwap()
      await tradePage.selectFromToken("Turbo")
      await tradePage.selectToToken("Near")
      await tradePage.enterFromAmount(10)
      await tradePage.waitForSwapCalculationToComplete()
      await tradePage.pressSwapButton()
      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.confirmTransactionCompleted()

      await tradePage.pressFormSwitchTokensButton()
      await tradePage.pressSwapButton()
      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.confirmTransactionCompleted(2)
    })
  }
)

test.describe(
  "NEAR Intents Wallet: OTC Trading",
  { tag: [NEAR_INTENTS_TAG, NEAR_INTENTS_TAG_OTC] },
  () => {
    test("Confirm user can cancel the OTC offer", async ({
      page,
      injectWeb3Provider,
    }) => {
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToOTC()
      await tradePage.selectSellToken("Turbo")
      await tradePage.selectBuyToken("Near")
      await tradePage.enterFromAmount(10)
      await tradePage.enterToAmount(10)
      await tradePage.pressCreateSwapLink()
      await wallet.reject(Web3RequestKind.SignTypedData)
      await tradePage.confirmOTCRejectedSignature()
    })

    test("Confirm user can create a offer that cannot be filled", async ({
      page,
      injectWeb3Provider,
    }) => {
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToOTC()
      await tradePage.selectSellToken("Turbo")
      await tradePage.selectBuyToken("Near")
      await tradePage.enterFromAmount(10000)
      await tradePage.enterToAmount(10000)
      await tradePage.pressCreateSwapLink()
      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.waitForMetamaskAction()
      await tradePage.closeOrderWindow()

      await tradePage.confirmOrderCannotBeFilled()
    })

    test("Confirm user can delete the OTC offer", async ({
      page,
      injectWeb3Provider,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToOTC()
      await tradePage.selectSellToken("Turbo")
      await tradePage.selectBuyToken("Near")
      await tradePage.enterFromAmount(10)
      await tradePage.enterToAmount(10)
      await tradePage.pressCreateSwapLink()

      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.confirmOrderWindowIsOpen()
      await tradePage.closeOrderWindow()
      await tradePage.confirmOTCCreated({
        sellAmount: 10,
        sellToken: "Turbo",
        buyAmount: 10,
        buyToken: "Near",
      })

      await tradePage.removeCreatedOTCOffer()
      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.confirmOTCCancelled()
    })

    test("Confirm user can create OTC offer", async ({
      page,
      injectWeb3Provider,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
      const homePage = new HomePage(page)
      const tradePage = new TradePage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToTradePage()
      await tradePage.switchToOTC()
      await tradePage.selectSellToken("Turbo")
      await tradePage.selectBuyToken("Near")
      await tradePage.enterFromAmount(10)
      await tradePage.enterToAmount(10)
      await tradePage.pressCreateSwapLink()

      await wallet.authorize(Web3RequestKind.SignTypedData)
      await tradePage.confirmOrderWindowIsOpen()
      await tradePage.confirmUserCanCopyLink()

      await tradePage.closeOrderWindow()
      await tradePage.confirmOTCCreated({
        sellAmount: 10,
        sellToken: "Turbo",
        buyAmount: 10,
        buyToken: "Near",
      })
    })
  }
)
