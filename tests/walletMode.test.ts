import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveWalletMode,
  resolveWalletAddressOverride,
  type WalletMode
} from '../src/walletMode.js';

test('resolveWalletMode defaults to proxy for backward compatibility', () => {
  const mode = resolveWalletMode([]);

  assert.equal(mode.mode, 'proxy');
  assert.equal(mode.label, 'Polymarket Proxy');
});

test('resolveWalletMode accepts safe from CLI argument', () => {
  const mode = resolveWalletMode(['--wallet-mode', 'safe']);

  assert.equal(mode.mode, 'safe');
  assert.equal(mode.label, 'Gnosis Safe');
});

test('resolveWalletMode accepts deposit from equals-style CLI argument', () => {
  const mode = resolveWalletMode(['--wallet-mode=deposit']);

  assert.equal(mode.mode, 'deposit');
  assert.equal(mode.label, 'Deposit Wallet');
});

test('resolveWalletMode lets CLI argument override environment value', () => {
  const mode = resolveWalletMode(['--wallet-mode', 'proxy'], 'deposit');

  assert.equal(mode.mode, 'proxy');
});

test('resolveWalletMode accepts environment value when CLI argument is absent', () => {
  const mode = resolveWalletMode([], 'SAFE');

  assert.equal(mode.mode, 'safe');
});

test('resolveWalletMode rejects unknown values', () => {
  assert.throws(
    () => resolveWalletMode(['--wallet-mode', 'metamask']),
    /Unsupported wallet mode "metamask"/
  );
});

test('resolveWalletMode rejects a missing CLI value', () => {
  assert.throws(
    () => resolveWalletMode(['--wallet-mode']),
    /Missing value for --wallet-mode/
  );
});

test('resolveWalletAddressOverride reads CLI address first', () => {
  const address = '0x1111111111111111111111111111111111111111';
  const envAddress = '0x2222222222222222222222222222222222222222';

  assert.equal(
    resolveWalletAddressOverride(['--wallet-address', address], envAddress),
    address
  );
});

test('resolveWalletAddressOverride reads equals-style CLI address', () => {
  const address = '0x1111111111111111111111111111111111111111';

  assert.equal(
    resolveWalletAddressOverride([`--wallet-address=${address}`]),
    address
  );
});

test('resolveWalletAddressOverride falls back to environment address', () => {
  const address = '0x2222222222222222222222222222222222222222';

  assert.equal(resolveWalletAddressOverride([], address), address);
});

test('resolveWalletAddressOverride returns null when absent', () => {
  assert.equal(resolveWalletAddressOverride([]), null);
});

test('resolveWalletAddressOverride rejects invalid addresses', () => {
  assert.throws(
    () => resolveWalletAddressOverride(['--wallet-address', '0x123']),
    /Invalid wallet address/
  );
});

test('all wallet modes are represented', () => {
  const modes: WalletMode[] = ['proxy', 'safe', 'deposit'];

  assert.deepEqual(modes, ['proxy', 'safe', 'deposit']);
});
