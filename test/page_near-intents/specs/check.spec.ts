import { Web3RequestKind } from "headless-web3-provider"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import { test } from "../fixtures/near-intents"

test.use(NEAR_INTENTS_PAGE)

test("Check provider injection", async ({ page, injectWeb3Provider }) => {
  const wallet = await injectWeb3Provider(page)
  // simple sanity check: request accounts resolves
  await wallet.authorize(Web3RequestKind.RequestAccounts)
})
