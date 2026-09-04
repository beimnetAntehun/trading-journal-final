export const DIR = { LONG: 'long', SHORT: 'short' }

function normalizeRate(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return num > 1 ? num / 100 : num
}

export function sanitizeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export function grossPnl(trade = {}) {
  const entry = sanitizeNumber(trade.entry)
  const exit = sanitizeNumber(trade.exit)
  const size = sanitizeNumber(trade.size)
  const direction = trade.direction === DIR.SHORT ? 'short' : 'long'

  if (entry <= 0 || exit <= 0 || size <= 0) {
    return 0
  }

  return direction === 'long' ? (exit - entry) * size : (entry - exit) * size
}

export function netPnl(trade = {}) {
  const fees = sanitizeNumber(trade.fees)
  return grossPnl(trade) - fees
}

export function riskRewardRatio(trade = {}) {
  const entry = sanitizeNumber(trade.entry)
  const stopLoss = sanitizeNumber(trade.stopLoss)
  const takeProfit = sanitizeNumber(trade.takeProfit)

  if (!trade.stopLoss || !trade.takeProfit || entry <= 0 || stopLoss <= 0 || stopLoss === entry) {
    return 0
  }

  const risk = Math.abs(entry - stopLoss)
  const reward = Math.abs(takeProfit - entry)
  if (risk <= 0) return 0

  const value = reward / risk
  return Number.isFinite(value) ? value : 0
}

export function rMultiple(trade = {}) {
  const entry = sanitizeNumber(trade.entry)
  const exit = sanitizeNumber(trade.exit)
  const stopLoss = sanitizeNumber(trade.stopLoss)

  if (!trade.stopLoss || entry <= 0 || stopLoss <= 0 || stopLoss === entry) {
    return 0
  }

  const risk = Math.abs(entry - stopLoss)
  if (risk <= 0) return 0

  const value = (exit - entry) / risk
  return Number.isFinite(value) ? value : 0
}

export function profitFactor(trades = []) {
  const grossProfit = trades.reduce((sum, trade) => {
    const pnl = sanitizeNumber(trade?.grossPnl ?? trade?.pnl ?? trade?.value ?? 0)
    return pnl > 0 ? sum + pnl : sum
  }, 0)

  const grossLoss = Math.abs(
    trades.reduce((sum, trade) => {
      const pnl = sanitizeNumber(trade?.grossPnl ?? trade?.pnl ?? trade?.value ?? 0)
      return pnl < 0 ? sum + pnl : sum
    }, 0)
  )

  if (grossLoss === 0) {
    return grossProfit > 0 ? Math.min(grossProfit, 100) : 0
  }

  const value = grossProfit / grossLoss
  return Number.isFinite(value) ? value : 0
}

export function expectancy({ winRate, avgWin, lossRate, avgLoss }) {
  const win = normalizeRate(winRate)
  const avgWinValue = sanitizeNumber(avgWin)
  const loss = normalizeRate(lossRate)
  const avgLossValue = sanitizeNumber(avgLoss)

  return win * avgWinValue - loss * avgLossValue
}

export function calculatePeakEquity(values = []) {
  const nums = values.map((value) => sanitizeNumber(value))
  if (!nums.length) return []

  let peak = nums[0]
  return nums.map((value) => {
    peak = Math.max(peak, value)
    return peak
  })
}

export function calculateDrawdown(values = []) {
  const nums = values.map((value) => sanitizeNumber(value))
  if (!nums.length) return []

  const peaks = calculatePeakEquity(nums)

  return nums.map((value, index) => {
    const peak = peaks[index]
    if (peak === 0) return 0
    return ((value - peak) / peak) * 100
  })
}
