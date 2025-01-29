#!/bin/bash -e

output_file="./src/utils/bannedNearAddress.ts"
gist_url="https://gist.githubusercontent.com/vzctl/90be7090b5ea32b8cc63f87a93d8a292/raw"

# Ensure the output directory exists
mkdir -p "$(dirname "$output_file")"

echo "Downloading banned near addresses from gist..."

# Download and validate addresses from gist, convert to lowercase
addresses=$(curl -s "$gist_url" | grep -E '^0x[a-fA-F0-9]{40}$' | tr '[:upper:]' '[:lower:]' || true)

# Check if addresses were successfully retrieved and valid
if [ -z "$addresses" ]; then
    echo "Warning: No valid Ethereum addresses found in gist or failed to download"
    echo "Generation cancelled - keeping existing file if present"
    exit 0
fi

# Generate TypeScript content
cat > "$output_file" << EOL
/**
 * This file is auto-generated. Do not edit manually.
 * These addresses represent legacy NEAR accounts that were created before EVM support was added.
 * Interacting with these addresses is dangerous as they can initiate unauthorized ft_withdraw
 * transactions, potentially leading to stolen funds. Always validate addresses against this list
 * before processing any transactions.
 */
export const bannedNearAddress = new Set([
$(echo "$addresses" | sed 's/^/  "/;s/$/"/' | tr '\n' ',' | sed 's/,$//')
])

export function isBannedNearAddress(address: string): boolean {
  return bannedNearAddress.has(address.toLowerCase())
}
EOL

# Format the output file
yarn -s biome format "$output_file" --write

echo "Banned near addresses generated successfully in $output_file"
