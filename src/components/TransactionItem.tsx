import { LIST_TOKENS } from "@src/constants/tokens"
import { useTokenList } from "@src/hooks/useTokenList"
import AssetComboIcon from "./DefuseSDK/components/Asset/AssetComboIcon"
import { FormattedCurrency } from "./DefuseSDK/features/account/components/shared/FormattedCurrency"
import type { Transaction } from "./DefuseSDK/features/account/types/sharedTypes"
import { midTruncate } from "./DefuseSDK/features/withdraw/components/WithdrawForm/utils"
import ListItem from "./ListItem"

const TransactionItem = ({
  type,
  token,
  amount,
  usdValue,
  address,
  toToken,
}: Transaction) => {
  const tokenList = useTokenList(LIST_TOKENS)
  const tokenInfo = tokenList.find((t) => t.symbol === token)

  return (
    <ListItem>
      <AssetComboIcon icon={tokenInfo?.icon} showChainIcon badgeType={type} />

      <ListItem.Content>
        <ListItem.Title className="capitalize">{type}</ListItem.Title>
        {Boolean(type) && (
          <ListItem.Subtitle>
            {type === "send" && `To: ${midTruncate(address)}`}
            {type === "receive" && `From: ${midTruncate(address)}`}
            {type === "swap" && `${token} to ${toToken}`}
          </ListItem.Subtitle>
        )}
      </ListItem.Content>

      <ListItem.Content align="end">
        <ListItem.Title>
          {amount} {token}
        </ListItem.Title>
        <ListItem.Subtitle>
          <FormattedCurrency
            value={usdValue ?? 0}
            formatOptions={{ currency: "USD" }}
          />
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  )
}

export default TransactionItem
