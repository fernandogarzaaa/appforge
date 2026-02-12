# Swarm Wallet (Local Only)

## Critical Security Warning

- Never commit seed phrases or private keys to git.
- Any wallet material that has ever been committed (even once) must be treated as compromised.
- Use a dedicated hot wallet with small funds if you insist on auto-signing trades.

## Configuration (Recommended)

This project is configured via `.env.local` (ignored by git):

- `SOLANA_RPC_URL`
- `SOLANA_WALLET_ADDRESS`
- `SOLANA_PRIVATE_KEY` (required only if you enable auto-signing)

Suggested safety defaults:

- `SWARM_REALITY_MODE=false` until you finish key rotation + security hardening
- `REAL_TRADING_ENABLED=false`
- `SWARM_AUTO_EXECUTE_TRADES=false`
- `SWARM_AUTONOMOUS_TRADING_ENABLED=false`

## Wallet Files

- `swarm/data/swarm_wallet.example.json` is a template (safe to commit).
- Do not create or commit `swarm/data/swarm_wallet.json` or `swarm/data/swarm_wallet_backup.json`.

## Key Rotation Checklist

1. Create a brand new Solana wallet (Phantom or hardware wallet).
2. Fund the new wallet only after confirming the address in your wallet UI.
3. Update `.env.local` with the new address.
4. Only set `SOLANA_PRIVATE_KEY` if you accept the risk of a hot wallet and auto-signing.

