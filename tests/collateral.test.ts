import test from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG } from '../src/config.js';
import { resolveCollateralCurrency } from '../src/collateral.js';

test('resolveCollateralCurrency defaults to the pUSD adapter route', () => {
  const selected = resolveCollateralCurrency([]);

  assert.equal(selected.currency, 'pusd');
  assert.equal(selected.label, 'pUSD');
  assert.equal(selected.collateralToken, CONFIG.contracts.pusd);
  assert.equal(selected.standardTarget, CONFIG.contracts.ctfCollateralAdapter);
  assert.equal(selected.negRiskTarget, CONFIG.contracts.negRiskCtfCollateralAdapter);
});

test('resolveCollateralCurrency accepts the legacy USDC.e direct route from CLI argument', () => {
  const selected = resolveCollateralCurrency(['--collateral', 'usdce']);

  assert.equal(selected.currency, 'usdce');
  assert.equal(selected.label, 'USDC.e');
  assert.equal(selected.collateralToken, CONFIG.contracts.usdce);
  assert.equal(selected.standardTarget, CONFIG.contracts.ctf);
  assert.equal(selected.negRiskTarget, CONFIG.contracts.negRiskAdapter);
});

test('resolveCollateralCurrency accepts USDC.e from equals-style CLI argument', () => {
  const selected = resolveCollateralCurrency(['--collateral=usdc.e']);

  assert.equal(selected.currency, 'usdce');
  assert.equal(selected.collateralToken, CONFIG.contracts.usdce);
});

test('resolveCollateralCurrency lets CLI argument override environment value', () => {
  const selected = resolveCollateralCurrency(['--collateral', 'pusd'], 'usdce');

  assert.equal(selected.currency, 'pusd');
  assert.equal(selected.collateralToken, CONFIG.contracts.pusd);
});

test('resolveCollateralCurrency accepts environment value when CLI argument is absent', () => {
  const selected = resolveCollateralCurrency([], 'USDC');

  assert.equal(selected.currency, 'usdce');
  assert.equal(selected.collateralToken, CONFIG.contracts.usdce);
});

test('resolveCollateralCurrency rejects unknown collateral values', () => {
  assert.throws(
    () => resolveCollateralCurrency(['--collateral', 'dai']),
    /Unsupported collateral "dai"/
  );
});
