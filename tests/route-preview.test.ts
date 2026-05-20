import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeFunctionData, zeroHash, type Hex } from 'viem';

import { CONFIG } from '../src/config.js';
import { resolveCollateralCurrency } from '../src/collateral.js';
import { createCtfRedeemTx, createNegRiskRedeemTx } from '../src/transactions.js';

const CONDITION_ID =
  '0x2222222222222222222222222222222222222222222222222222222222222222' as Hex;
const AMOUNTS = [500_000n, 1_250_000n];

test('pUSD standard route preview uses the V2 adapter target and pUSD collateral argument', () => {
  const route = resolveCollateralCurrency(['--collateral', 'pusd']);
  const tx = createCtfRedeemTx(CONDITION_ID, route);
  const decoded = decodeFunctionData({
    abi: CONFIG.abis.ctfCollateralAdapterRedeem,
    data: tx.data
  });

  assert.equal(tx.to, CONFIG.contracts.ctfCollateralAdapter);
  assert.deepEqual(decoded.args, [
    CONFIG.contracts.pusd,
    zeroHash,
    CONDITION_ID,
    [1n, 2n]
  ]);
});

test('pUSD negative-risk route preview uses the V2 negative-risk adapter target', () => {
  const route = resolveCollateralCurrency(['--collateral', 'pusd']);
  const tx = createNegRiskRedeemTx(CONDITION_ID, AMOUNTS, route);
  const decoded = decodeFunctionData({
    abi: CONFIG.abis.negRiskRedeem,
    data: tx.data
  });

  assert.equal(tx.to, CONFIG.contracts.negRiskCtfCollateralAdapter);
  assert.deepEqual(decoded.args, [CONDITION_ID, AMOUNTS]);
});
