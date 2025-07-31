#!/bin/bash -e

# Get absolute paths
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(dirname "$script_dir")"
existing_json="$project_root/artifacts/defuse_contract_abi.json"
type_output="$project_root/src/components/DefuseSDK/types/defuse-contracts-types.d.ts"

# Ensure the output directory exists
mkdir -p "$(dirname "$type_output")"

# Step 1: Check if the JSON file exists; if not, download and extract it in memory
if [ ! -f "$existing_json" ]; then
  echo "JSON file not found. Downloading and processing artifact in memory..."

  # Download and unzip the artifact, save temporarily, then transform
  temp_file=$(mktemp)
  curl -L "https://github.com/defuse-protocol/defuse-contracts/actions/runs/11357099231/artifacts/2061097870" \
    | unzip -p - "defuse_contract_abi.json" > "$temp_file"
  schema=$(node "$script_dir/transform-abi.mjs" "$temp_file")
  rm "$temp_file"
else
  echo "JSON file found. Processing existing file..."

  # Transform the existing file using our ES module script
  schema=$(node "$script_dir/transform-abi.mjs" "$existing_json")
fi

# Step 2: Pass the modified JSON directly to json-schema-to-typescript
echo "$schema" | npm_config_registry="https://registry.npmjs.org" npx json-schema-to-typescript -o "$type_output" --unreachableDefinitions
# Prettify the output
yarn -s biome format "$type_output" --write

echo "Types generated successfully in "$type_output""
