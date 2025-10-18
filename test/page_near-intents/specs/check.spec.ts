import { MetaMask } from "@synthetixio/synpress/playwright"
import { NEAR_INTENTS_PAGE } from "../../helpers/constants/pages"
import nearWeb3ProdSetup from "../../wallet-setup/near-web3-prod.setup"
import { test } from "../fixtures/near-intents"

test.use(NEAR_INTENTS_PAGE)

test("Check synpress", ({ page, context, extensionId }) => {
  new MetaMask(context, page, nearWeb3ProdSetup.walletPassword, extensionId)
})
