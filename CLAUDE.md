# Defuse Frontend

> Multi-chain DeFi swap/bridge via intent-based cross-chain execution on NEAR Intents contract.

## Core Concepts

**1-Click API**: The foundation of swapping. Get quote → generates deposit address → user transfers funds → receives tokens back. No wallet signature required for the swap itself.
- Swap uses 1-Click API via `swapIntent1csMachine`
- Deposit/Withdraw currently use bridges directly (will migrate to 1-Click)

**Intent System**: Users declare *what* they want (swap X for Y), solvers figure out *how*. All settlements on NEAR Intents contract (`intents.near` prod / `staging-intents.near` stage).

**Token Types**: Two types exist—always use type guards.
- `BaseTokenInfo` — single token with `defuseAssetId`
- `UnifiedTokenInfo` — grouped tokens with `groupedTokens[]`
- Use `getDefuseAssetId(token)` from `utils/token.ts` — handles both

**State**: XState machines drive all flows. Zustand for persistence. TanStack Query for server state.

## Commands

```bash
bun run dev         # Dev server :3000
bun run build       # Production build
bun run typecheck   # Type checking
bun run check       # Biome lint (strict)
bun run test        # Vitest
```

## Architecture

All machines: `src/components/DefuseSDK/features/machines/`

### Swap (1-Click)
```
SwapWidget → swapUIMachine → background1csQuoterMachine → swapIntent1csMachine → intentStatusMachine
```
- Quote returns deposit address, user sends funds, solver executes
- Key: `services/quoteService.ts`, `features/machines/swapIntent1csMachine.ts`

### Deposit
```
DepositWidget → depositUIMachine → depositGenerateAddressMachine → deposit[Chain]Actor
```
- Chain actors are instances of `depositMachine` provided with chain-specific impls via `.provide()` in `DepositUIMachineProvider.tsx`
- Key: `features/machines/depositUIMachine.ts`, `features/deposit/`

### Withdraw
```
WithdrawWidget → withdrawUIMachine → withdrawFormReducer → prepareWithdrawActor
```
- If liquidity swap needed → spawns `swapIntentMachine`
- Key: `features/machines/withdrawUIMachine.ts`, `services/withdrawService.ts`

### Balance / Account
- Balances unified on Intents (USDC = USDC regardless of origin chain)
- Stored per `defuseAssetId`, summed via `computeTotalBalanceDifferentDecimals()`
- Key: `features/account/` — queries, hooks (`useWatchHoldings`), utils (`holdingsUtils`)

### Wallet Verification
```
WalletVerificationProvider → walletVerificationMachine → verifyWalletSignature
```
- Tests wallet can sign intents before allowing swaps
- Calls `simulate_intents` on NEAR contract to verify signature
- Key: `src/providers/WalletVerificationProvider.tsx`, `src/machines/walletVerificationMachine.ts`

## Key Files

| What | Path |
|------|------|
| All machines | `src/components/DefuseSDK/features/machines/` |
| Quote service | `src/components/DefuseSDK/services/quoteService.ts` |
| Token utils | `src/components/DefuseSDK/utils/token.ts` |
| Types | `src/components/DefuseSDK/types/base.ts` |
| Wallet hook | `src/hooks/useConnectWallet.ts` |
| Provider order | `src/app/(app)/layout.tsx` |

## External Packages

Core logic lives in these (not this repo):
- `@defuse-protocol/intents-sdk` — Intent building, 1-Click quotes, routes
- `@defuse-protocol/internal-utils` — solverRelay, messageFactory
- `@defuse-protocol/contract-types` — Intent types

## Gotchas

- **Token guards**: Always `isBaseToken()` / `isUnifiedToken()` before accessing properties
- **Quote expiry**: Quotes have `expirationTime` — never cache stale quotes
- **Machine paths**: ALL machines in `features/machines/`, not per-feature folders
- **Biome strict**: No `console.log` (use `logger`), no unused imports/vars
- **Provider order**: Moving providers breaks hooks that depend on outer context


## Planning a Feature

> Use this section when building a new feature or making non-trivial changes. It defines how to approach the work — explore, plan, build, verify.

### Principles

- **Simplicity**: Minimal code impact. Every change as simple as possible.
- **Root Cause**: No temporary fixes. Ask "WHY" repeatedly.
- **Elegance**: For non-trivial changes, pause — "is there a more elegant way?" Skip for obvious fixes.

### Workflow

1. **Explore First** — Use subagents to understand existing patterns, find similar implementations, identify the right files. Don't guess — know.
2. **Plan with Estimates** — Write plan with checkable items. Include estimated files changed and LOC.
3. **PR Size Check** — Alert if PR will touch 10+ files. Stop and ask: can this be split? Smaller PRs = faster reviews, fewer bugs. Warn if touching core machines.
4. **Subagents** — Offload research and parallel analysis to keep main context clean. One focused task per subagent.
5. **Verify Before Done** — Never mark complete without proving it works. Run tests, check logs, diff behavior. Ask: "Would a staff engineer approve this?"
6. **If Stuck, Re-plan** — Don't keep pushing when something goes sideways. Stop and re-plan immediately.

### React Patterns

**Avoid useEffect for state sync.** Use event handlers that send to machines:

```typescript
// Good — event handler → machine
onChange: (e) => actorRef.send({ type: "input", params: { amount: e.target.value } })

// Bad — useEffect watching state to sync
useEffect(() => { actorRef.send(...) }, [formValue])
```

**Machine owns logic, form owns UI.** Machine actions write back via `setValue()`:

```typescript
logic={machine.provide({
  actions: {
    updateUIAmount: ({ context }) => setValue("amountOut", context.formValues.amountOut),
  },
})}
```

**Subscribe to machine events, not state changes:**

```typescript
useEffect(() => {
  const sub = actorRef.on("*", (event) => {
    if (event.type === "INTENT_SETTLED") queryClient.invalidateQueries({ queryKey: ["swap_history"] })
  })
  return () => sub.unsubscribe()
}, [actorRef])
```

**Inject dependencies via `.provide()`, not imports:**

```typescript
<MachineContext.Provider
  logic={machine.provide({
    actors: { sendTx: fromPromise(({ input }) => sendTransaction(input)) },
  })}
>
```

### PLanning Checklist

- [ ] Explore codebase properly when planning, use subagents liberally to do so
- [ ] Plan includes estimates (files changed, LOC)
- [ ] Warning if PR touches <10 files 
- [ ] Plan solves problem at root and not just a patch
- [ ] Plan isn't overnegineered would clear a staff engineer review
- [ ] No useEffect syncing state — use event handlers
- [ ] Machine drives form via `setValue()`, not reverse
- [ ] Side effects via `actorRef.on()` events, not effect deps
- [ ] Dependencies injected with `.provide()`, not hardcoded
- [ ] Services return `Result` types, accept `AbortSignal`

---
*Domain knowledge > generic patterns. Simplicity > cleverness. Root cause > surface fix.*
