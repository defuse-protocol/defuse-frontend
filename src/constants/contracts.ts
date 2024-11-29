export enum INDEXER {
  INTENT_0 = 0,
  INTENT_1 = 1,
}

const CONTRACTS_MAINNET = {
  [INDEXER.INTENT_0]: "esufed.near",
  [INDEXER.INTENT_1]: "swap-defuse.near",
}

const CONTRACTS_TESTNET = {
  [INDEXER.INTENT_0]: "dintent.testnet",
  [INDEXER.INTENT_1]: "",
}

export const CONTRACTS_REGISTER =
  process.env.environment === "development"
    ? Object.assign({}, CONTRACTS_TESTNET)
    : Object.assign({}, CONTRACTS_MAINNET)

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
export const MAX_GAS_TRANSACTION = `300${"0".repeat(12)}`
export const FT_STORAGE_DEPOSIT_GAS = "30000000000000"
export const FT_WITHDRAW_GAS = "50000000000000"
export const FT_MINIMUM_STORAGE_BALANCE_LARGE = "12500000000000000000000"
export const FT_TRANSFER_GAS = ""
export const TOKEN_TRANSFER_DEPOSIT = ""
export const ONE_YOCTO_NEAR = `1${"0".repeat(24)}`

export const CONFIRM_SWAP_LOCAL_KEY = "__d_confirm_swap"
export const NEAR_COLLECTOR_KEY = "__d_history_collector"
export const CONNECTOR_ETH_BASE = "__d_eth_base_connector"
export const CONNECTOR_BTC_MAINNET = "__d_btc_mainnet_connector"

export const CREATE_INTENT_EXPIRATION_BLOCK_BOOST = 350
export const CREATE_INTENT_ROLLBACK_DELAY = 90

export const PRECISION = 10 ** 24 // In 24 decimals
