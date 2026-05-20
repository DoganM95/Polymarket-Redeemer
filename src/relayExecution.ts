import {
  RelayClient,
  RelayerTxType,
  type DepositWalletCall
} from '@polymarket/builder-relayer-client';
import { BuilderConfig, type BuilderApiKeyCreds } from '@polymarket/builder-signing-sdk';
import type { WalletClient, Address } from 'viem';

import { CONFIG } from './config.js';
import type { Transaction } from './types.js';
import type { SelectedWalletMode } from './walletMode.js';

export interface RelayLike {
  deriveDepositWalletAddress?: () => Promise<string>;
  execute: (transactions: Transaction[], metadata?: string) => Promise<{ wait: () => Promise<unknown> }>;
  executeDepositWalletBatch?: (
    calls: DepositWalletCall[],
    walletAddress: string,
    deadline: string
  ) => Promise<{ wait: () => Promise<unknown> }>;
}

export interface CreateRelayClientOptions {
  walletMode: SelectedWalletMode;
  wallet: WalletClient;
  builderCreds: BuilderApiKeyCreds;
}

export function createRelayClient(options: CreateRelayClientOptions): RelayClient {
  const builderConfig = new BuilderConfig({
    localBuilderCreds: options.builderCreds
  });

  if (options.walletMode.mode === 'proxy') {
    return new RelayClient(
      CONFIG.api.relayerUrl,
      CONFIG.blockchain.chainId,
      options.wallet,
      builderConfig,
      RelayerTxType.PROXY
    );
  }

  if (options.walletMode.mode === 'safe') {
    return new RelayClient(
      CONFIG.api.relayerUrl,
      CONFIG.blockchain.chainId,
      options.wallet,
      builderConfig,
      RelayerTxType.SAFE
    );
  }

  return new RelayClient(
    CONFIG.api.relayerUrl,
    CONFIG.blockchain.chainId,
    options.wallet,
    builderConfig
  );
}

export interface ResolveExecutionWalletAddressOptions {
  client: Pick<RelayLike, 'deriveDepositWalletAddress'>;
  walletMode: SelectedWalletMode;
  savedWalletAddress: Address | string;
  ownerAddress: Address | string;
  overrideWalletAddress: Address | string | null;
}

export async function resolveExecutionWalletAddress(
  options: ResolveExecutionWalletAddressOptions
): Promise<Address> {
  if (options.overrideWalletAddress) {
    return options.overrideWalletAddress as Address;
  }

  if (options.walletMode.mode !== 'deposit') {
    return options.savedWalletAddress as Address;
  }

  if (!options.client.deriveDepositWalletAddress) {
    throw new Error('Installed relayer client does not support deposit wallet address derivation.');
  }

  return (await options.client.deriveDepositWalletAddress()) as Address;
}

export interface ExecuteRedemptionTransactionsOptions {
  client: RelayLike;
  walletMode: SelectedWalletMode;
  walletAddress: Address | string;
  transactions: Transaction[];
  metadata: string;
  nowMs?: number;
}

function toDepositWalletCalls(transactions: Transaction[]): DepositWalletCall[] {
  return transactions.map(tx => ({
    target: tx.to,
    value: tx.value,
    data: tx.data
  }));
}

export async function executeRedemptionTransactions(
  options: ExecuteRedemptionTransactionsOptions
): Promise<{ wait: () => Promise<unknown> }> {
  if (options.walletMode.mode !== 'deposit') {
    return options.client.execute(options.transactions, options.metadata);
  }

  if (!options.client.executeDepositWalletBatch) {
    throw new Error('Installed relayer client does not support deposit wallet batch execution.');
  }

  const nowMs = options.nowMs ?? Date.now();
  const deadline = Math.floor(nowMs / 1000 + 600).toString();

  return options.client.executeDepositWalletBatch(
    toDepositWalletCalls(options.transactions),
    options.walletAddress,
    deadline
  );
}
