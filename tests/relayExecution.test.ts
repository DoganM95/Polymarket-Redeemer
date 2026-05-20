import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveExecutionWalletAddress, executeRedemptionTransactions } from '../src/relayExecution.js';
import type { SelectedWalletMode } from '../src/walletMode.js';
import type { Transaction } from '../src/types.js';

const OWNER_ADDRESS = '0x1111111111111111111111111111111111111111';
const SAVED_WALLET = '0x2222222222222222222222222222222222222222';
const OVERRIDE_WALLET = '0x3333333333333333333333333333333333333333';
const DERIVED_DEPOSIT_WALLET = '0x4444444444444444444444444444444444444444';

const proxyMode: SelectedWalletMode = { mode: 'proxy', label: 'Polymarket Proxy' };
const safeMode: SelectedWalletMode = { mode: 'safe', label: 'Gnosis Safe' };
const depositMode: SelectedWalletMode = { mode: 'deposit', label: 'Deposit Wallet' };

const tx: Transaction = {
  to: '0x5555555555555555555555555555555555555555',
  data: '0x1234',
  value: '0'
};

class FakeRelayClient {
  public executeCalls: unknown[] = [];
  public depositBatchCalls: unknown[] = [];

  async deriveDepositWalletAddress(): Promise<string> {
    return DERIVED_DEPOSIT_WALLET;
  }

  async execute(transactions: Transaction[], metadata?: string): Promise<{ wait: () => Promise<unknown> }> {
    this.executeCalls.push({ transactions, metadata });
    return { wait: async () => ({ transactionHash: '0xproxy' }) };
  }

  async executeDepositWalletBatch(
    calls: Array<{ target: string; value: string; data: string }>,
    walletAddress: string,
    deadline: string
  ): Promise<{ wait: () => Promise<unknown> }> {
    this.depositBatchCalls.push({ calls, walletAddress, deadline });
    return { wait: async () => ({ transactionHash: '0xdeposit' }) };
  }
}

test('resolveExecutionWalletAddress uses saved wallet for proxy mode', async () => {
  const client = new FakeRelayClient();

  const address = await resolveExecutionWalletAddress({
    client,
    walletMode: proxyMode,
    savedWalletAddress: SAVED_WALLET,
    ownerAddress: OWNER_ADDRESS,
    overrideWalletAddress: null
  });

  assert.equal(address, SAVED_WALLET);
});

test('resolveExecutionWalletAddress uses saved wallet for safe mode', async () => {
  const client = new FakeRelayClient();

  const address = await resolveExecutionWalletAddress({
    client,
    walletMode: safeMode,
    savedWalletAddress: SAVED_WALLET,
    ownerAddress: OWNER_ADDRESS,
    overrideWalletAddress: null
  });

  assert.equal(address, SAVED_WALLET);
});

test('resolveExecutionWalletAddress derives wallet for deposit mode', async () => {
  const client = new FakeRelayClient();

  const address = await resolveExecutionWalletAddress({
    client,
    walletMode: depositMode,
    savedWalletAddress: SAVED_WALLET,
    ownerAddress: OWNER_ADDRESS,
    overrideWalletAddress: null
  });

  assert.equal(address, DERIVED_DEPOSIT_WALLET);
});

test('resolveExecutionWalletAddress lets override win for deposit mode', async () => {
  const client = new FakeRelayClient();

  const address = await resolveExecutionWalletAddress({
    client,
    walletMode: depositMode,
    savedWalletAddress: SAVED_WALLET,
    ownerAddress: OWNER_ADDRESS,
    overrideWalletAddress: OVERRIDE_WALLET
  });

  assert.equal(address, OVERRIDE_WALLET);
});

test('executeRedemptionTransactions uses execute for proxy mode', async () => {
  const client = new FakeRelayClient();

  await executeRedemptionTransactions({
    client,
    walletMode: proxyMode,
    walletAddress: SAVED_WALLET,
    transactions: [tx],
    metadata: 'Redeem: test',
    nowMs: 1_000_000
  });

  assert.equal(client.executeCalls.length, 1);
  assert.equal(client.depositBatchCalls.length, 0);
  assert.deepEqual(client.executeCalls[0], {
    transactions: [tx],
    metadata: 'Redeem: test'
  });
});

test('executeRedemptionTransactions uses execute for safe mode', async () => {
  const client = new FakeRelayClient();

  await executeRedemptionTransactions({
    client,
    walletMode: safeMode,
    walletAddress: SAVED_WALLET,
    transactions: [tx],
    metadata: 'Redeem: test',
    nowMs: 1_000_000
  });

  assert.equal(client.executeCalls.length, 1);
  assert.equal(client.depositBatchCalls.length, 0);
});

test('executeRedemptionTransactions uses deposit wallet batch for deposit mode', async () => {
  const client = new FakeRelayClient();

  await executeRedemptionTransactions({
    client,
    walletMode: depositMode,
    walletAddress: DERIVED_DEPOSIT_WALLET,
    transactions: [tx],
    metadata: 'Redeem: test',
    nowMs: 1_000_000
  });

  assert.equal(client.executeCalls.length, 0);
  assert.equal(client.depositBatchCalls.length, 1);
  assert.deepEqual(client.depositBatchCalls[0], {
    calls: [
      {
        target: tx.to,
        value: tx.value,
        data: tx.data
      }
    ],
    walletAddress: DERIVED_DEPOSIT_WALLET,
    deadline: '1000600'
  });
});
