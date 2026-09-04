import test from 'node:test'
import assert from 'node:assert/strict'

import {
  grossPnl,
  netPnl,
  riskRewardRatio,
  rMultiple,
  profitFactor,
  expectancy,
  calculatePeakEquity,
  calculateDrawdown,
} from './tradingMath.js'

test('grossPnl calculates long and short positions', () => {
  assert.equal(grossPnl({ direction: 'long', entry: 100, exit: 110, size: 2, fees: 0 }), 20)
  assert.equal(grossPnl({ direction: 'short', entry: 100, exit: 95, size: 2, fees: 0 }), 10)
})

test('netPnl subtracts fees', () => {
  assert.equal(netPnl({ direction: 'long', entry: 100, exit: 110, size: 2, fees: 3 }), 17)
})

test('rMultiple guards against invalid risk inputs', () => {
  assert.equal(rMultiple({ direction: 'long', entry: 100, exit: 110, size: 2, stopLoss: 100 }), 0)
  assert.equal(rMultiple({ direction: 'long', entry: 100, exit: 110, size: 2, stopLoss: 80 }), 0.5)
  assert.equal(rMultiple({ direction: 'long', entry: 100, exit: 110, size: 2 }), 0)
})

test('riskRewardRatio uses the correct reward/risk distance formula', () => {
  assert.equal(riskRewardRatio({ entry: 100, stopLoss: 80, takeProfit: 160 }), 3)
  assert.equal(riskRewardRatio({ entry: 100, stopLoss: 90, takeProfit: 120 }), 2)
  assert.equal(riskRewardRatio({ entry: 100, stopLoss: 100, takeProfit: 120 }), 0)
})

test('profitFactor handles zero-loss edge cases', () => {
  assert.equal(profitFactor([{ grossPnl: 100 }, { grossPnl: 30 }]), 100)
  assert.equal(profitFactor([{ grossPnl: -25 }, { grossPnl: 50 }, { grossPnl: -10 }]), 50 / 35)
})

test('expectancy works for win/loss distribution', () => {
  assert.equal(expectancy({ winRate: 0.6, avgWin: 100, lossRate: 0.4, avgLoss: 50 }), 40)
})

test('peak equity and drawdown are computed cumulatively', () => {
  const series = [1000, 1200, 1100, 1300, 900]
  assert.deepEqual(calculatePeakEquity(series), [1000, 1200, 1200, 1300, 1300])
  assert.deepEqual(calculateDrawdown(series), [0, 0, -8.333333333333332, 0, -30.76923076923077])
})
