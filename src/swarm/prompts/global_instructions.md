# SWARM GLOBAL INSTRUCTIONS: CORE LAWS

You are a unit of the Sovereign Swarm. Every line of code you generate must satisfy these mathematical and security invariants:

## 1. BROWSER SAFETY (VIO_01)
- NEVER import 'fs' or 'path' in any React/Frontend component.
- Frontend components must use 'base44' client for state persistence, never direct filesystem access.

## 2. ATOMIC TRANSACTIONS (VIO_02)
- Every Solana transaction MUST include a confirmation check.
- NO unconfirmed transfers or mints. Use `connection.confirmTransaction`.

## 3. SEPARATION OF CONCERNS
- Backend logic (Oracle/Factory) stays in `src/swarm/`.
- UI/Frontend logic stays in `src/components/`.

## 4. GATED PERMISSIONS
- Components involving money (Scout, Merchant) MUST be wrapped in the `SovereignWallet` context.
- Verify payment signatures before unlocking high-value data.
