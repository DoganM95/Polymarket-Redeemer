# Polymarket Gasless Redeem CLI

Redeem resolved Polymarket positions through Polymarket's gasless relayer on Polygon.

This project is a community tool. It is not affiliated with, endorsed by, or maintained by Polymarket. Use it at your own risk, verify transactions on PolygonScan, and test with small amounts first.

## What It Does

- Finds redeemable Polymarket positions for your proxy wallet.
- Builds CTF or NegRisk redemption transactions.
- Submits transactions through the Polymarket Builder Relayer.
- Supports the current pUSD V2 adapter route and the legacy USDC.e direct route.
- Provides a Python wrapper for interval-based automation.

## Requirements

- Node.js 18+
- npm
- Python 3.8+ only if you want `--interval` scheduling
- A terminal: macOS/Linux shell (`zsh` or `bash`) or Windows PowerShell
- Polygon PoS HTTPS RPC URL
- Wallet private key for the EOA linked to your Polymarket account
- Polymarket proxy wallet / funder address
- Polymarket Builder API key, secret, and passphrase

## Install

```bash
git clone https://github.com/NocodeSolutions/polymarket-gasless-redeem-cli.git
cd polymarket-gasless-redeem-cli
npm install
```

## First-Time Setup

Run the setup wizard:

```bash
npm run setup
```

The wizard asks for:

| Value | Notes |
| --- | --- |
| Polygon PoS RPC URL | Must be HTTPS and for Polygon mainnet, chain ID 137. |
| Wallet private key | EOA wallet linked to your Polymarket account. |
| Proxy wallet address | Polymarket funder address where positions are held. |
| Builder API key | From Polymarket Builder Codes. |
| Builder API secret | Shown when the API key is created. |
| Builder API passphrase | Passphrase for the API key. |
| Encryption password | Used to unlock local encrypted credentials. |

Need a Polygon RPC endpoint? Use Polygon's PoS RPC reference:
https://docs.polygon.technology/pos/reference/rpc-endpoints#rpc-api-methods

Credentials are stored in `.encrypted_keys` using AES-256-GCM encryption. The file is ignored by git.

To reconfigure everything:

```bash
npm run reset
```

## Pick The Right Route

Polymarket V2 uses pUSD. This tool now defaults to the pUSD adapter route for both standard CTF and negative-risk redemptions.

| Route | Option | Standard target | Negative-risk target |
| --- | --- | --- | --- |
| Current pUSD V2 route | omit the flag, or use `--collateral pusd` | `CtfCollateralAdapter` | `NegRiskCtfCollateralAdapter` |
| Legacy USDC.e route | `--collateral usdce` | `CTF` | `NegRiskAdapter` |

Use the legacy USDC.e route only if your account still fails through the default pUSD route.

Default pUSD commands:

```bash
npm run check
npm run redeem
```

Legacy USDC.e commands:

```bash
npm run check -- --collateral usdce
npm run redeem -- --collateral usdce
```

The `--` after `npm run ...` is required. It passes the remaining arguments into the TypeScript CLI.

Direct TypeScript commands:

```bash
npx tsx src/redeem.ts --check
npx tsx src/redeem.ts
npx tsx src/redeem.ts --check --collateral usdce
npx tsx src/redeem.ts --collateral usdce
```

Python wrapper:

```bash
python redeem_cli.py --check
python redeem_cli.py --once
python redeem_cli.py --interval 15
python redeem_cli.py --check --collateral usdce
python redeem_cli.py --once --collateral usdce
python redeem_cli.py --interval 15 --collateral usdce
```

For automated runs, you can set an environment variable instead:

macOS/Linux (`zsh` or `bash`):

```bash
export REDEEM_COLLATERAL=usdce
```

Windows PowerShell:

```powershell
$env:REDEEM_COLLATERAL="usdce"
```

Useful Polymarket references:

- Redeem docs: https://docs.polymarket.com/trading/ctf/redeem
- V2 migration: https://docs.polymarket.com/v2-migration
- Contract addresses: https://docs.polymarket.com/resources/contracts

## Safe Test Run

Use check mode before redeeming:

```bash
npm run check
```

For USDC.e accounts:

```bash
npm run check -- --collateral usdce
```

Check mode:

- loads your encrypted credentials
- connects to Polymarket's Data API
- lists redeemable positions
- does not submit any transaction

## Redeem Once

Default pUSD:

```bash
npm run redeem
```

USDC.e:

```bash
npm run redeem -- --collateral usdce
```

Python wrapper:

```bash
python redeem_cli.py --once
python redeem_cli.py --once --collateral usdce
```

## Run On An Interval

The Python wrapper adds scheduling:

```bash
python redeem_cli.py --interval 15
```

USDC.e interval run:

```bash
python redeem_cli.py --interval 15 --collateral usdce
```

For unattended use, set `REDEEM_PASSWORD` so the process does not prompt for the encryption password:

macOS/Linux (`zsh` or `bash`):

```bash
export REDEEM_PASSWORD="your_encryption_password"
export REDEEM_COLLATERAL="usdce"
python redeem_cli.py --interval 15
```

Windows PowerShell:

```powershell
$env:REDEEM_PASSWORD="your_encryption_password"
$env:REDEEM_COLLATERAL="usdce"
python redeem_cli.py --interval 15
```

Only use `REDEEM_PASSWORD` on machines and shells you trust.

## Commands

| Task | Command |
| --- | --- |
| Setup credentials | `npm run setup` |
| Reset credentials | `npm run reset` |
| Check positions | `npm run check` |
| Check positions with USDC.e | `npm run check -- --collateral usdce` |
| Redeem once | `npm run redeem` |
| Redeem once with USDC.e | `npm run redeem -- --collateral usdce` |
| Show Node help | `npm run help` |
| Python check | `python redeem_cli.py --check` |
| Python redeem once | `python redeem_cli.py --once` |
| Python interval | `python redeem_cli.py --interval 15` |
| Python interval with USDC.e | `python redeem_cli.py --interval 15 --collateral usdce` |

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `REDEEM_PASSWORD` | Encryption password for unattended runs. |
| `REDEEM_COLLATERAL` | `pusd` or `usdce`; default is `pusd`. CLI `--collateral` overrides it. |
| `RPC_URL` | Optional Polygon PoS HTTPS RPC override. If unset, the setup-saved RPC URL is used. |
| `LOG_LEVEL` | `ERROR`, `WARN`, `INFO`, or `DEBUG`. Default is `INFO`. |
| `MAX_CONCURRENT_REDEMPTIONS` | Max parallel redemptions. Default is `3`. |

## How It Works

The maintained implementation is TypeScript:

- `src/redeem.ts` is the main CLI.
- `src/transactions.ts` builds CTF and NegRisk redemption transactions.
- `src/collateral.ts` resolves `pusd` vs `usdce`.
- `redeem_cli.py` is a Python wrapper that calls `npx tsx src/redeem.ts`.

Root-level JavaScript snapshots were removed. Use the npm, npx, or Python commands above.

Transaction flow:

1. Fetch redeemable positions from `https://data-api.polymarket.com`.
2. Group positions by condition ID.
3. Build a CTF or NegRisk redemption transaction.
4. Submit through `https://relayer-v2.polymarket.com`.
5. Wait for confirmation and print PolygonScan links.

## Troubleshooting

### Keys not configured

Run:

```bash
npm run setup
```

### Wrong route / redemption fails

Try the other route in check mode first:

```bash
npm run check
npm run check -- --collateral usdce
```

Then redeem with the route that matches your account. The default pUSD route calls the Polymarket V2 collateral adapters. The USDC.e route is the legacy fallback.

### Polygon RPC URL is not configured

The tool runs on Polygon PoS mainnet, chain ID 137. Polygon's RPC reference is here:
https://docs.polygon.technology/pos/reference/rpc-endpoints#rpc-api-methods

Either run setup/reset again:

```bash
npm run reset
```

or set an RPC URL:

macOS/Linux (`zsh` or `bash`):

```bash
export RPC_URL="https://your-polygon-rpc-url"
```

Windows PowerShell:

```powershell
$env:RPC_URL="https://your-polygon-rpc-url"
```

### Python cannot set up keys

That is expected. Key setup and reset are Node-only:

```bash
npm run setup
npm run reset
```

Use Python only for `--check`, `--once`, and `--interval`.

## Development

Run tests:

```bash
npm test
```

Build TypeScript:

```bash
npm run build
```

Preview route encoding manually:

```bash
node --import tsx -e "import { decodeFunctionData } from 'viem'; import { CONFIG } from './src/config.ts'; import { resolveCollateralCurrency } from './src/collateral.ts'; import { createCtfRedeemTx } from './src/transactions.ts'; const route=resolveCollateralCurrency(['--collateral','pusd']); const tx=createCtfRedeemTx('0x1111111111111111111111111111111111111111111111111111111111111111', route); const decoded=decodeFunctionData({ abi: CONFIG.abis.ctfCollateralAdapterRedeem, data: tx.data }); console.log({ target: tx.to, collateral: decoded.args[0] });"
```

Expected pUSD output:

```text
{
  target: '0xAdA100Db00Ca00073811820692005400218FcE1f',
  collateral: '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB'
}
```

Expected USDC.e output when using `--collateral usdce`:

```text
{
  target: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
  collateral: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
}
```

## Security Notes

- Never commit `.encrypted_keys`, `.env`, private keys, API secrets, or passwords.
- Prefer check mode before redeeming.
- Review transaction hashes on PolygonScan.
- `REDEEM_PASSWORD` is convenient for services but exposes the password to that process environment.

## License

MIT
