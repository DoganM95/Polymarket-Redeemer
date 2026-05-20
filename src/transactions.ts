/**
 * Transaction Builders using Viem
 * Uses the official Polymarket prepareEncodeFunctionData pattern
 */

import { encodeFunctionData, prepareEncodeFunctionData, zeroHash, type Hex } from 'viem';
import type { Transaction } from './types.js';
import { CONFIG } from './config.js';
import { validators, logger } from './utils.js';
import { resolveCollateralCurrency, type SelectedCollateral } from './collateral.js';

/**
 * Prepare CTF redeem function encoding (done once at module load)
 * CTF and CtfCollateralAdapter share the same redeemPositions signature.
 */
const ctfRedeemPrepared = prepareEncodeFunctionData({
  abi: CONFIG.abis.ctfCollateralAdapterRedeem,
  functionName: 'redeemPositions'
});

/**
 * Prepare NegRisk redeem function encoding (done once at module load)
 */
const negRiskRedeemPrepared = prepareEncodeFunctionData({
  abi: CONFIG.abis.negRiskRedeem,
  functionName: 'redeemPositions'
});

/**
 * Create CTF redeem transaction for standard binary markets
 * Redeems both outcomes (indexSets [1, 2]) in a single call
 */
export function createCtfRedeemTx(
  conditionId: Hex,
  route: SelectedCollateral = resolveCollateralCurrency([])
): Transaction {
  if (!validators.isValidBytes32(conditionId)) {
    throw new Error(`Invalid condition ID: ${conditionId}`);
  }

  const data = encodeFunctionData({
    ...ctfRedeemPrepared,
    args: [route.collateralToken, zeroHash, conditionId, [1n, 2n]]
  });

  logger.debug('Created CTF redeem transaction', {
    to: route.standardTarget,
    conditionId,
    collateral: route.label,
    collateralToken: route.collateralToken,
    outcomes: [1, 2]
  });

  return {
    to: route.standardTarget,
    data,
    value: '0'
  };
}

/**
 * Create NegRisk adapter redeem transaction for negative risk markets
 * @param conditionId - The condition ID to redeem
 * @param amounts - Array of amounts [yesTokens, noTokens] in base units (1e6 for pUSD decimals)
 */
export function createNegRiskRedeemTx(
  conditionId: Hex,
  amounts: bigint[],
  route: SelectedCollateral = resolveCollateralCurrency([])
): Transaction {
  if (!validators.isValidBytes32(conditionId)) {
    throw new Error(`Invalid condition ID: ${conditionId}`);
  }

  if (!Array.isArray(amounts) || amounts.length === 0) {
    throw new Error('Amounts must be a non-empty array');
  }

  // Validate amounts are non-negative bigints
  for (const amount of amounts) {
    if (typeof amount !== 'bigint' || amount < 0n) {
      throw new Error(`Invalid amount: ${amount}. Must be non-negative bigint.`);
    }
  }

  const data = encodeFunctionData({
    ...negRiskRedeemPrepared,
    args: [conditionId, amounts]
  });

  logger.debug('Created NegRisk redeem transaction', {
    to: route.negRiskTarget,
    conditionId,
    collateral: route.label,
    amounts: amounts.map(a => a.toString())
  });

  return {
    to: route.negRiskTarget,
    data,
    value: '0'
  };
}

/**
 * Calculate redemption amounts from position sizes
 * Converts floating point sizes to base units (1e6 for pUSD)
 */
export function calculateRedeemAmounts(sizes: number[]): bigint[] {
  return sizes.map(size => {
    const scaled = Math.floor(size * 1e6);
    return BigInt(Math.max(0, scaled));
  });
}

