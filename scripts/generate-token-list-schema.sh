#!/bin/bash -e

output_file="./src/tokens/schema/tokenlist.schema.json"
type_source_file="./src/components/DefuseSDK/types/base.ts"

# Generating JSON Schema
bunx ts-json-schema-generator@2.4.0 \
  --path "$type_source_file" \
  --type "TokenList" \
  --out "$output_file"

echo "✅ TokenList JSON Schema generated successfully in $output_file"

bunx ajv-cli validate \
  -s "$output_file" \
  -d "src/tokens/*.json"

echo "✅ Token list validation passed"

# Ensure the schema is in sync
if [ "$CI" = "true" ] || [ "$CI" = "1" ]; then
  if ! git diff --ignore-space-at-eol --exit-code --quiet "$output_file"; then
    echo "❌ ERROR: Schema file has uncommitted changes!"
    echo "The generated schema doesn't match the committed version."
    echo ""
    echo "Please run './scripts/generate-schema.sh' locally and commit the changes."
    echo ""
    echo "Detected changes:"
    git --no-pager diff "$output_file"
    exit 1
  fi
  echo "✅ Schema is up to date"
fi
