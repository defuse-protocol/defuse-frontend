#
# This script automates the process of propagating changes from the 'main' branch
# to multiple dedicated NearIntents projects. It ensures that the user is on the 
# correct branch before pulling the latest updates and pushing them to the specified 
# repositories. This is particularly useful for developers working on multiple 
# related projects, as it streamlines the update process and reduces the risk of 
# errors associated with manual updates.
#
# Usage:
# 1. Ensure you are on the 'main' branch of your local repository.
# 2. Run this script to pull the latest changes and push them to the 
#    NearIntents projects: near-intents, solana, dogecoinswap, and turboswap.
#

# Check if the current branch is 'main'
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "Error: You are on branch '$current_branch'. Please switch to 'main' branch."
    exit 1
fi

# Pull the latest changes from 'main'
git pull origin main

# Run one after the other: 
git push origin main:solana
git push origin main:dogecoinswap
git push origin main:turboswap
git push origin main:trumpswap

