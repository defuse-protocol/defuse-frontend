# Core Protocol Functionality

This directory contains fundamental components of the Near Intents protocol implementation. Code in this directory should be:

- **Protocol-level**: Implements core protocol concepts and functionality
- **UI-independent**: No dependencies on UI frameworks or components
- **Foundational**: Other parts of the SDK build upon these implementations
- **Stable**: Changes here affect many dependent features

## Current Contents

- `messages.ts`: Implementation of Near Intents protocol intent messages
  - Swap intents
  - Withdraw intents
  - Message signing formats (NEP-413, ERC-191, etc.)

- `formatters.ts`: Standardized protocol wire format handling:
  - Serializes signed intents into protocol-compatible format
  - Handles intents signed using different singing formats (NEP-413, ERC-191, etc.)
  - Converts user identities from various chains to protocol format

## Adding New Code

When considering adding new code to this directory, ask:

1. Is this a fundamental protocol concept?
2. Do multiple features depend on this functionality?
3. Is this independent of specific UI implementations?
4. Would changes here affect protocol compatibility?

If the answer to most of these questions is "yes", then it belongs in core.
