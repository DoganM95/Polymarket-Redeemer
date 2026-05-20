# Release Notes

## v2.1.0

### Added

- Added `--wallet-mode proxy|safe|deposit`.
- Added `REDEEM_WALLET_MODE` for automated wallet-mode selection.
- Added `--wallet-address` and `REDEEM_WALLET_ADDRESS` to override the wallet/funder address used for position lookup and relayer execution.
- Added deposit wallet execution through relayer `WALLET` batches using `executeDepositWalletBatch()`.
- Added Safe wallet execution through `RelayerTxType.SAFE`.
- Added tests for wallet-mode parsing, wallet-address precedence, and wallet-mode relayer execution.

### Changed

- Upgraded `@polymarket/builder-relayer-client` to `^0.0.9` for deposit wallet support.
- README now separates wallet mode from collateral route, with guidance for proxy, Safe, and deposit-wallet users.

### Verification

- `npm test`
- `npm run build`
- `npm run help`
- `python -m py_compile redeem_cli.py`
- `python redeem_cli.py --help`

## v2.0.2

### Changed

- Routed default pUSD redemptions through Polymarket V2 collateral adapters:
  - standard CTF: `CtfCollateralAdapter`
  - negative-risk: `NegRiskCtfCollateralAdapter`
- Kept `--collateral usdce` as the legacy direct route:
  - standard CTF: `CTF`
  - negative-risk: `NegRiskAdapter`
- Added route-preview tests that decode calldata and assert both target contracts and collateral arguments without submitting transactions.
- Updated README guidance and Polymarket V2 documentation links.

### Verification

- `npm test`
- `npm run build`

## v2.0.1

### Changed

- Added selectable standard CTF redemption collateral:
  - default remains `pUSD`
  - use `--collateral usdce` for accounts that still redeem with USDC.e
  - use `REDEEM_COLLATERAL=usdce` for automated runs
- Added Python wrapper support for `--collateral pusd|usdce`.
- Added regression tests that decode redemption calldata and verify the selected collateral token address.
- Removed legacy root-level JavaScript snapshots; the maintained implementation is TypeScript under `src/`.
- Rewrote `README.md` into a shorter usage-focused guide with clear macOS/Linux and Windows PowerShell examples.

### Usage

Check without redeeming:

```bash
npm run check -- --collateral usdce
```

Redeem with USDC.e:

```bash
npm run redeem -- --collateral usdce
```

Python interval mode with USDC.e:

```bash
python redeem_cli.py --interval 15 --collateral usdce
```

### Verification

- `npm test`
- `npm run build`
