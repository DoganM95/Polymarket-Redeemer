import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeFunctionData, zeroHash, type Hex } from 'viem';

import { CONFIG } from '../src/config.js';
import {
  createCtfRedeemTx,
  createNegRiskRedeemTx,
  calculateRedeemAmounts
} from '../src/transactions.js';
import { resolveCollateralCurrency } from '../src/collateral.js';

const CONDITION_ID =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;

const AMOUNTS = [1_000_000n, 2_500_000n];

function decodeCtfRedeem(data: Hex) {
  return decodeFunctionData({
    abi: CONFIG.abis.ctfRedeem,
    data
  });
}

function decodeNegRiskRedeem(data: Hex) {
  return decodeFunctionData({
    abi: CONFIG.abis.negRiskRedeem,
    data
  });
}

test('createCtfRedeemTx sends pUSD standard redemptions through the V2 collateral adapter', () => {
  const route = resolveCollateralCurrency(['--collateral', 'pusd']);
  const tx = createCtfRedeemTx(CONDITION_ID, route);

  const decoded = decodeCtfRedeem(tx.data);

  assert.equal(tx.to, CONFIG.contracts.ctfCollateralAdapter);
  assert.equal(decoded.functionName, 'redeemPositions');
  assert.deepEqual(decoded.args, [
    CONFIG.contracts.pusd,
    zeroHash,
    CONDITION_ID,
    [1n, 2n]
  ]);
});

test('createCtfRedeemTx keeps USDC.e standard redemptions on the legacy CTF route', () => {
  const route = resolveCollateralCurrency(['--collateral', 'usdce']);
  const tx = createCtfRedeemTx(CONDITION_ID, route);

  const decoded = decodeCtfRedeem(tx.data);

  assert.equal(tx.to, CONFIG.contracts.ctf);
  assert.deepEqual(decoded.args, [
    CONFIG.contracts.usdce,
    zeroHash,
    CONDITION_ID,
    [1n, 2n]
  ]);
});

test('createNegRiskRedeemTx sends pUSD negative-risk redemptions through the V2 adapter', () => {
  const route = resolveCollateralCurrency(['--collateral', 'pusd']);
  const tx = createNegRiskRedeemTx(CONDITION_ID, AMOUNTS, route);

  const decoded = decodeNegRiskRedeem(tx.data);

  assert.equal(tx.to, CONFIG.contracts.negRiskCtfCollateralAdapter);
  assert.equal(decoded.functionName, 'redeemPositions');
  assert.deepEqual(decoded.args, [CONDITION_ID, AMOUNTS]);
});

test('createNegRiskRedeemTx keeps USDC.e negative-risk redemptions on the legacy adapter route', () => {
  const route = resolveCollateralCurrency(['--collateral', 'usdce']);
  const tx = createNegRiskRedeemTx(CONDITION_ID, AMOUNTS, route);

  const decoded = decodeNegRiskRedeem(tx.data);

  assert.equal(tx.to, CONFIG.contracts.negRiskAdapter);
  assert.deepEqual(decoded.args, [CONDITION_ID, AMOUNTS]);
});

test('calculateRedeemAmounts scales pUSD-sized decimal values to 6 decimals', () => {
  assert.deepEqual(calculateRedeemAmounts([1, 2.5, 0.000001, -3]), [
    1_000_000n,
    2_500_000n,
    1n,
    0n
  ]);
});
