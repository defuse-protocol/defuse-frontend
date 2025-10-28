import { Web3RequestKind } from "headless-web3-provider"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import {
  NEAR_INTENTS_TAG,
  NEAR_INTENTS_TAG_DEPOSIT,
  NEAR_INTENTS_TAG_WITHDRAW,
} from "../../helpers/constants/tags"
import { test } from "../fixtures/near-intents"
import { AccountPage } from "../pages/account.page"
import { DepositPage } from "../pages/deposit.page"
import { HomePage } from "../pages/home.page"

test.use(NEAR_INTENTS_PAGE)

test.beforeEach(
  "Login to Near Web3 wallet with MetaMask",
  async ({ page, nearIntentsPreconditions }) => {
    await page.goto(NEAR_INTENTS_PAGE.baseURL)
    await nearIntentsPreconditions.loginToNearIntents()
    await nearIntentsPreconditions.isSignatureCheckRequired()
    await nearIntentsPreconditions.waitForAccountSync()
  }
)

test.describe(
  "NEAR Intents Wallet: Deposit",
  { tag: [NEAR_INTENTS_TAG, NEAR_INTENTS_TAG_DEPOSIT] },
  () => {
    test("Confirm user cannot deposit more than balance allows", async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const depositPage = new DepositPage(page)
      await homePage.navigateToDepositPage()
      await depositPage.selectAssetToken("Turbo")
      await depositPage.selectAssetNetwork("TurboChain")
      await depositPage.enterDepositValue(1000000)
      await depositPage.confirmInsufficientBalance()
    })

    test("Confirm user can deny the deposit", async ({
      page,
      injectWeb3Provider,
    }) => {
      const homePage = new HomePage(page)
      const depositPage = new DepositPage(page)
      const wallet = await injectWeb3Provider(page)
      await homePage.navigateToDepositPage()
      await depositPage.selectAssetToken("Turbo")
      await depositPage.selectAssetNetwork("TurboChain")
      await depositPage.enterDepositValue(0.001)
      await depositPage.clickDeposit()
      await wallet.authorize(Web3RequestKind.AddEthereumChain)
      await wallet.authorize(Web3RequestKind.SwitchEthereumChain)
      await depositPage.waitForMetamaskAction()
      await wallet.reject(Web3RequestKind.SendTransaction)

      await depositPage.confirmTransactionCancelled()
    })

    test("Confirm user can deposit", async ({ page, injectWeb3Provider }) => {
      const homePage = new HomePage(page)
      const depositPage = new DepositPage(page)
      const wallet = await injectWeb3Provider(page)

      await homePage.navigateToDepositPage()
      await depositPage.selectAssetToken("Turbo")
      await depositPage.selectAssetNetwork("TurboChain")
      await depositPage.enterDepositValue(0.001)
      await depositPage.clickDeposit()

      await wallet.authorize(Web3RequestKind.AddEthereumChain)
      await wallet.authorize(Web3RequestKind.SwitchEthereumChain)
      await depositPage.waitForMetamaskAction()
      await wallet.authorize(Web3RequestKind.SendTransaction)

      await depositPage.confirmTransactionCompleted()
    })
  }
)

test.describe(
  "NEAR Intents Wallet: Withdraw",
  { tag: [NEAR_INTENTS_TAG, NEAR_INTENTS_TAG_WITHDRAW] },
  () => {
    test("Confirm that user cannot withdraw more than allowed", async ({
      page,
      nearIntentsPreconditions,
    }) => {
      const homePage = new HomePage(page)
      const accountsPage = new AccountPage(page)
      await homePage.navigateToAccountPage()
      await accountsPage.navigateToWithdrawPage()
      await accountsPage.selectWithdrawToken("Turbo")
      await accountsPage.enterAmount(10000)
      await accountsPage.selectTargetNetwork("TurboChain")

      await accountsPage.enterTargetAccount(
        await nearIntentsPreconditions.getAccountAddress()
      )
      await accountsPage.confirmWithdrawal()
      await accountsPage.confirmWithdrawInsufficientBalance()
    })

    test("Confirm user can deny withdraw", async ({
      page,
      nearIntentsPreconditions,
      injectWeb3Provider,
    }) => {
      const homePage = new HomePage(page)
      const accountsPage = new AccountPage(page)
      const wallet = await injectWeb3Provider(page)
      await homePage.navigateToAccountPage()
      await accountsPage.navigateToWithdrawPage()
      await accountsPage.selectWithdrawToken("Turbo")
      await accountsPage.enterAmount(0.0001)
      await accountsPage.selectTargetNetwork("TurboChain")
      await accountsPage.enterTargetAccount(
        await nearIntentsPreconditions.getAccountAddress()
      )
      await accountsPage.confirmWithdrawal()

      await wallet.reject(Web3RequestKind.SignTypedData)
      await accountsPage.confirmTransactionCancelled()
    })

    test("Confirm that user can withdraw", async ({
      page,
      nearIntentsPreconditions,
      injectWeb3Provider,
    }) => {
      const homePage = new HomePage(page)
      const accountsPage = new AccountPage(page)
      const wallet = await injectWeb3Provider(page)
      await homePage.navigateToAccountPage()
      await accountsPage.navigateToWithdrawPage()
      await accountsPage.selectWithdrawToken("Turbo")
      await accountsPage.enterAmount(0.0001)
      await accountsPage.selectTargetNetwork("TurboChain")
      await accountsPage.enterTargetAccount(
        await nearIntentsPreconditions.getAccountAddress()
      )
      await accountsPage.confirmWithdrawal()

      await wallet.authorize(Web3RequestKind.SignTypedData)
      await accountsPage.confirmWithdrawalState("Pending")
      await accountsPage.confirmWithdrawalState("Completed")
    })
  }
)
