import { generateInsights, getSession } from './src/lib/insights.js'

// Simple mock trades
const trades = [
  {
    id: 'trd_1',
    accountId: 'acc_live',
    symbol: 'BTCUSD',
    assetClass: 'crypto',
    direction: 'long',
    entryDate: '2026-07-20T10:00:00', // London
    exitDate: '2026-07-20T12:00:00',
    entryPrice: 60000,
    exitPrice: 61000, // Win: +1000
    size: 1,
    multiplier: 1,
    fees: 10,
    stopLoss: 59500, // Risk: 500. R-multiple = +1000 / 500 = 2R
    strategy: 'Breakout',
    grade: 5,
    emotions: ['Confident', 'Disciplined'],
    followedPlan: 'yes'
  },
  {
    id: 'trd_2',
    accountId: 'acc_live',
    symbol: 'BTCUSD',
    assetClass: 'crypto',
    direction: 'long',
    entryDate: '2026-07-21T10:00:00', // London
    exitDate: '2026-07-21T11:00:00',
    entryPrice: 61000,
    exitPrice: 62000, // Win: +1000
    size: 1,
    multiplier: 1,
    fees: 10,
    stopLoss: 60500, // Risk: 500. R-multiple = 2R
    strategy: 'Breakout',
    grade: 4,
    emotions: ['Confident'],
    followedPlan: 'yes'
  },
  {
    id: 'trd_3',
    accountId: 'acc_live',
    symbol: 'ETHUSD',
    assetClass: 'crypto',
    direction: 'short',
    entryDate: '2026-07-22T15:00:00', // New York
    exitDate: '2026-07-22T17:00:00',
    entryPrice: 34000,
    exitPrice: 35000, // Loss: -1000
    size: 1,
    multiplier: 1,
    fees: 15,
    stopLoss: 33500, // Risk: 500. R-multiple = -2R
    strategy: 'Pullback',
    grade: 2,
    emotions: ['FOMO', 'Anxious'],
    followedPlan: 'no'
  },
  {
    id: 'trd_4',
    accountId: 'acc_live',
    symbol: 'ETHUSD',
    assetClass: 'crypto',
    direction: 'short',
    entryDate: '2026-07-23T16:00:00', // New York
    exitDate: '2026-07-23T18:00:00',
    entryPrice: 35000,
    exitPrice: 36000, // Loss: -1000
    size: 1,
    multiplier: 1,
    fees: 15,
    stopLoss: 34500, // Risk: 500. R-multiple = -2R
    strategy: 'Pullback',
    grade: 1,
    emotions: ['FOMO', 'Revenge'],
    followedPlan: 'no'
  }
]

console.log('Testing getSession mapping:')
console.log('10:00 (London):', getSession('2026-07-20T10:00:00'))
console.log('15:00 (New York):', getSession('2026-07-20T15:00:00'))
console.log('02:00 (Asian):', getSession('2026-07-20T02:00:00'))

console.log('\nGenerating insights on mock trades...')
const insights = generateInsights(trades)
console.log('Number of insights generated:', insights.length)
console.log(JSON.stringify(insights, null, 2))
