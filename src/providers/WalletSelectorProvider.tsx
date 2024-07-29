"use client"

import type {
  AccountState,
  Wallet,
  WalletSelector,
} from "@near-wallet-selector/core"
import { setupWalletSelector } from "@near-wallet-selector/core"
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui"
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet"
import { setupHereWallet } from "@near-wallet-selector/here-wallet"
import { setupMathWallet } from "@near-wallet-selector/math-wallet"
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet"
import { setupNarwallets } from "@near-wallet-selector/narwallets"
import { setupModal } from "@near-wallet-selector/modal-ui"
import { setupNearFi } from "@near-wallet-selector/nearfi"
import { setupNightly } from "@near-wallet-selector/nightly"
import { setupSender } from "@near-wallet-selector/sender"
import { setupBitgetWallet } from "@near-wallet-selector/bitget-wallet"
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect"
import { setupWelldoneWallet } from "@near-wallet-selector/welldone-wallet"
import { setupNearSnap } from "@near-wallet-selector/near-snap"
import { setupNeth } from "@near-wallet-selector/neth"
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet"
import { setupLedger } from "@near-wallet-selector/ledger"
import { setupXDEFI } from "@near-wallet-selector/xdefi"
import { setupRamperWallet } from "@near-wallet-selector/ramper-wallet"
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet"
import { setupMintbaseWallet } from "@near-wallet-selector/mintbase-wallet"
import { setupEthereumWallets } from "@aurora-is-near/ethereum-wallets"
import { createWeb3Modal } from "@web3modal/wagmi"
import {
  reconnect,
  http,
  createConfig,
  type Config,
  createStorage,
  cookieStorage,
} from "@wagmi/core"
import { type Chain } from "@wagmi/core/chains"
import { injected, walletConnect } from "@wagmi/connectors"
import {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useContext,
  useMemo,
} from "react"
import { distinctUntilChanged, map } from "rxjs"
import { WalletModuleFactory } from "@near-wallet-selector/core/src/lib/wallet/wallet.types"

import getWebsiteUrl from "@src/utils/getWebsiteUrl"

declare global {
  interface Window {
    selector: WalletSelector
    modal: WalletSelectorModal
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector
  modal: WalletSelectorModal
  accounts: Array<AccountState>
  accountId: string | null
}

import { Loading } from "@src/components/Loading"

const NEAR_ENV = process.env.NEAR_ENV ?? "testnet"
const NEAR_NODE_URL = process.env.nearNodeUrl ?? "https://rpc.mainnet.near.org"
const WALLET_CONNECT_PROJECT_ID = process.env.walletConnectProjectId ?? ""

const chainId = Number(process.env.nearChainIdEthWallets)
const near: Chain = {
  id: chainId,
  name: "Near",
  nativeCurrency: {
    decimals: 18,
    name: "NEAR",
    symbol: "NEAR",
  },
  rpcUrls: {
    default: { http: [process.env.rpcEthWallets!] },
    public: { http: [process.env.rpcEthWallets!] },
  },
  blockExplorers: {
    default: {
      name: "NEAR Explorer",
      url: process.env.walletExplorerUrlEthWallets!,
    },
  },
  testnet: false,
}

const url = getWebsiteUrl()
const metadata = {
  name: "Defuse",
  description: "Your Multichain DeFi Hub",
  url: getWebsiteUrl(),
  icons: [`${url}/android-chrome-512x512.png`],
}
export const wagmiConfig: Config = createConfig({
  chains: [near],
  transports: {
    [near.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId: WALLET_CONNECT_PROJECT_ID!,
      metadata,
      showQrModal: false,
    }),
    injected({ shimDisconnect: true }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
})
reconnect(wagmiConfig)

const web3Modal = createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: WALLET_CONNECT_PROJECT_ID,
  themeMode: "light",
  themeVariables: {
    "--w3m-font-size-master": "9.5px",
    "--w3m-font-family":
      '__monaSans_70dae0, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    // https://docs.walletconnect.com/appkit/react/core/theming#themevariables
  },
  allWallets: "SHOW",
  enableOnramp: false,
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3", // Brave
    "fbc8d86ad914ebd733fec4812b4b7af5ca709fdd9e75a930115e5baa02c4ef4c", // Rabby
    "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18", // Zerion
  ],
})

export const WalletSelectorContext =
  createContext<WalletSelectorContextValue | null>(null)

export const WalletSelectorProvider: React.FC<{
  children: ReactNode
}> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null)
  const [modal, setModal] = useState<WalletSelectorModal | null>(null)
  const [accounts, setAccounts] = useState<Array<AccountState>>([])
  const [loading, setLoading] = useState<boolean>(true)

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: {
        networkId: NEAR_ENV,
        nodeUrl: NEAR_NODE_URL,
        helperUrl: "",
        explorerUrl: "https://nearblocks.io",
        indexerUrl:
          "postgres://public_readonly:nearprotocol@mainnet.db.explorer.indexer.near.dev/mainnet_explorer",
      },
      debug: true,
      modules: [
        setupMyNearWallet(),
        setupLedger(),
        setupSender(),
        setupBitgetWallet(),
        setupMathWallet(),
        setupNightly(),
        setupMeteorWallet(),
        setupNearSnap(),
        setupNarwallets(),
        setupWelldoneWallet(),
        setupHereWallet(),
        setupCoin98Wallet(),
        setupNearFi(),
        setupRamperWallet(),
        setupNeth({
          gas: "300000000000000",
          bundle: false,
        }),
        setupXDEFI(),
        setupWalletConnect({
          projectId: WALLET_CONNECT_PROJECT_ID,
          metadata: {
            name: "Defuse Protocol",
            description:
              "Defuse: the premier platform for cross-chain liquidity and trading. Experience efficient, secure, and transparent swaps across multiple blockchains.",
            url: "https://github.com/defuse-protocol",
            icons: ["https://defuse.org/static/icons/Logo.svg"],
          },
        }),
        setupEthereumWallets({
          wagmiConfig,
          web3Modal,
          alwaysOnboardDuringSignIn: true,
          devMode: true,
          chainId,
          devModeAccount: "tellawraen.near",
        }),
        setupNearMobileWallet(),
        setupMintbaseWallet({
          contractId: "",
        }) as WalletModuleFactory<Wallet>,
      ],
    })
    const _modal = setupModal(_selector, {
      contractId: "",
    })
    const state = _selector.store.getState()
    setAccounts(state.accounts)

    // this is added for debugging purpose only
    // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
    window.selector = _selector
    window.modal = _modal

    setSelector(_selector)
    setModal(_modal)
    setLoading(false)
  }, [])

  useEffect(() => {
    init().catch((err) => {
      console.error(err)
      alert("Failed to initialise wallet selector")
    })
  }, [init])

  useEffect(() => {
    if (!selector) {
      return
    }

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        console.log("Accounts Update", nextAccounts)

        setAccounts(nextAccounts)
      })

    const onHideSubscription = modal!.on("onHide", ({ hideReason }) => {
      console.log(`The reason for hiding the modal ${hideReason}`)
    })

    return () => {
      subscription.unsubscribe()
      onHideSubscription.remove()
    }
  }, [selector, modal])

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      selector: selector!,
      modal: modal!,
      accounts,
      accountId: accounts.find((account) => account.active)?.accountId || null,
    }),
    [selector, modal, accounts]
  )

  if (loading) {
    return <Loading />
  }

  return (
    <WalletSelectorContext.Provider value={walletSelectorContextValue}>
      {children}
    </WalletSelectorContext.Provider>
  )
}

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext)

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    )
  }

  return context
}
