import type { Address } from 'viem';
import { validators } from './utils.js';

export type WalletMode = 'proxy' | 'safe' | 'deposit';

export interface SelectedWalletMode {
  mode: WalletMode;
  label: 'Polymarket Proxy' | 'Gnosis Safe' | 'Deposit Wallet';
}

const WALLET_MODES: Record<WalletMode, SelectedWalletMode> = {
  proxy: {
    mode: 'proxy',
    label: 'Polymarket Proxy'
  },
  safe: {
    mode: 'safe',
    label: 'Gnosis Safe'
  },
  deposit: {
    mode: 'deposit',
    label: 'Deposit Wallet'
  }
};

function normalizeWalletMode(value: string): WalletMode | null {
  const normalized = value.trim().toLowerCase().replace(/[-_\s]/g, '');

  if (normalized === 'proxy') {
    return 'proxy';
  }

  if (normalized === 'safe' || normalized === 'gnosissafe') {
    return 'safe';
  }

  if (normalized === 'deposit' || normalized === 'depositwallet') {
    return 'deposit';
  }

  return null;
}

function getArgValue(argv: readonly string[], flag: string): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === flag) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${flag}.`);
      }
      return value;
    }

    if (arg?.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }

  return null;
}

export function resolveWalletMode(
  argv: readonly string[] = process.argv.slice(2),
  envValue: string | undefined = process.env['REDEEM_WALLET_MODE']
): SelectedWalletMode {
  const rawValue = getArgValue(argv, '--wallet-mode') ?? envValue ?? 'proxy';
  const mode = normalizeWalletMode(rawValue);

  if (!mode) {
    throw new Error(`Unsupported wallet mode "${rawValue}". Use "proxy", "safe", or "deposit".`);
  }

  return WALLET_MODES[mode];
}

export function resolveWalletAddressOverride(
  argv: readonly string[] = process.argv.slice(2),
  envValue: string | undefined = process.env['REDEEM_WALLET_ADDRESS']
): Address | null {
  const rawValue = getArgValue(argv, '--wallet-address') ?? envValue;

  if (!rawValue) {
    return null;
  }

  const address = rawValue.trim();
  if (!validators.isValidAddress(address)) {
    throw new Error(`Invalid wallet address "${rawValue}". Expected a 20-byte 0x address.`);
  }

  return address as Address;
}
