import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeFunctionData, zeroHash, type Hex } from 'viem';

import { CONFIG } from '../src/config.js';
import { createCtfRedeemTx, calculateRedeemAmounts } from '../src/transactions.js';

const CONDITION_ID =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;

test('createCtfRedeemTx encodes pUSD as the collateral token', () => {
  const tx = createCtfRedeemTx(CONDITION_ID);

  const decoded = decodeFunctionData({
    abi: CONFIG.abis.ctfRedeem,
    data: tx.data
  });

  assert.equal(tx.to, CONFIG.contracts.ctf);
  assert.equal(decoded.functionName, 'redeemPositions');
  assert.deepEqual(decoded.args, [
    CONFIG.contracts.pusd,
    zeroHash,
    CONDITION_ID,
    [1n, 2n]
  ]);
});

test('createCtfRedeemTx encodes explicit USDC.e collateral when selected', () => {
  const tx = createCtfRedeemTx(CONDITION_ID, CONFIG.contracts.usdce);

  const decoded = decodeFunctionData({
    abi: CONFIG.abis.ctfRedeem,
    data: tx.data
  });

  assert.deepEqual(decoded.args, [
    CONFIG.contracts.usdce,
    zeroHash,
    CONDITION_ID,
    [1n, 2n]
  ]);
});

test('calculateRedeemAmounts scales pUSD-sized decimal values to 6 decimals', () => {
  assert.deepEqual(calculateRedeemAmounts([1, 2.5, 0.000001, -3]), [
    1_000_000n,
    2_500_000n,
    1n,
    0n
  ]);
});
