# Release Notes

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
