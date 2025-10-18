import { defineWalletSetup } from "@synthetixio/synpress"
import { MetaMask, getExtensionId } from "@synthetixio/synpress/playwright"
import { getSeedPhrase } from "../helpers/functions/system-variables"

const seedPhrase = getSeedPhrase()
const password = "password"

export default defineWalletSetup(password, async (context, walletPage) => {
  const extensionId = await getExtensionId(context, "MetaMask")
  const metamask = new MetaMask(context, walletPage, password, extensionId)
  await metamask.importWallet(seedPhrase)
})
