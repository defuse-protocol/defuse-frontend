#!/bin/bash -e

output_file="./src/gen/bannedNearAddress.json"
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

# Generate JSON content
json_content="["
for address in $addresses; do
    json_content+="\"$address\", "
done

# Remove trailing comma and space, then close the JSON structure
json_content="${json_content%, }]"
echo "$json_content" > "$output_file"

# Format the output file
yarn -s biome format "$output_file" --write

echo "Banned near addresses generated successfully in $output_file"
