import type { Address } from 'viem';
import { CONFIG } from './config.js';

export type CollateralCurrency = 'pusd' | 'usdce';

export interface SelectedCollateral {
  currency: CollateralCurrency;
  label: 'pUSD' | 'USDC.e';
  address: Address;
}

const COLLATERALS: Record<CollateralCurrency, SelectedCollateral> = {
  pusd: {
    currency: 'pusd',
    label: 'pUSD',
    address: CONFIG.contracts.pusd
  },
  usdce: {
    currency: 'usdce',
    label: 'USDC.e',
    address: CONFIG.contracts.usdce
  }
};

function normalizeCollateral(value: string): CollateralCurrency | null {
  const normalized = value.trim().toLowerCase().replace(/[-_\s]/g, '');

  if (normalized === 'pusd') {
    return 'pusd';
  }

  if (normalized === 'usdce' || normalized === 'usdc.e' || normalized === 'usdc') {
    return 'usdce';
  }

  return null;
}

function getCollateralArg(argv: readonly string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--collateral') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --collateral. Use "pusd" or "usdce".');
      }
      return value;
    }

    if (arg?.startsWith('--collateral=')) {
      return arg.slice('--collateral='.length);
    }
  }

  return null;
}

export function resolveCollateralCurrency(
  argv: readonly string[] = process.argv.slice(2),
  envValue: string | undefined = process.env['REDEEM_COLLATERAL']
): SelectedCollateral {
  const rawValue = getCollateralArg(argv) ?? envValue ?? 'pusd';
  const currency = normalizeCollateral(rawValue);

  if (!currency) {
    throw new Error(`Unsupported collateral "${rawValue}". Use "pusd" or "usdce".`);
  }

  return COLLATERALS[currency];
}
