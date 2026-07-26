import { isClosed, tradePnl, rMultiple, stats, groupStats, fmtMoney, fmtPct, DOW } from './calculations'

// Maps exit or entry hour to standard trading session (using hour 0-23 in local/UTC time)
export function getSession(isoString) {
  if (!isoString) return 'Other'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'Other'
  const hour = date.getHours()

  // Define standard sessions
  // Asian: 00:00 - 08:00
  // London: 08:00 - 14:00
  // New York: 14:00 - 22:00
  if (hour >= 0 && hour < 8) return 'Asian'
  if (hour >= 8 && hour < 14) return 'London'
  if (hour >= 14 && hour < 22) return 'New York'
  return 'Other'
}

export function generateInsights(trades) {
  const closed = trades.filter(isClosed)
  if (closed.length === 0) return []

  const list = []
  const overallStats = stats(closed)
  const totalLoss = closed
    .map(t => tradePnl(t) || 0)
    .filter(p => p < 0)
    .reduce((sum, p) => sum + p, 0)

  // 1. R-Multiple Ratio & Expectancy
  const rs = closed.map(rMultiple).filter(r => r != null)
  const positiveRs = rs.filter(r => r > 0)
  const negativeRs = rs.filter(r => r < 0)
  const avgWinR = positiveRs.length ? positiveRs.reduce((s, r) => s + r, 0) / positiveRs.length : 0
  const avgLossR = negativeRs.length ? negativeRs.reduce((s, r) => s + r, 0) / negativeRs.length : 0

  if (avgWinR > 0) {
    list.push({
      type: 'opportunity',
      category: 'r-multiple',
      title: 'Risk Reward Ratio',
      text: `Your average winning trade returns ${avgWinR.toFixed(2)}R, while your average losing trade risks ${Math.abs(avgLossR).toFixed(2)}R.`,
      value: `${avgLossR ? (avgWinR / Math.abs(avgLossR)).toFixed(1) : '∞'}:1 R/R`
    })
  }

  // 2. Best & Worst Strategy
  const byStrategy = groupStats(closed, t => t.strategy || 'Untagged')
  if (byStrategy.length > 0) {
    const bestStrat = byStrategy[0] // Sorted by descending total PnL
    const worstStrat = byStrategy[byStrategy.length - 1]

    if (bestStrat && bestStrat.count >= 2 && bestStrat.pnl > 0) {
      list.push({
        type: 'success',
        category: 'strategy',
        title: `Top Performer: ${bestStrat.key}`,
        text: `${bestStrat.key} trades have a ${fmtPct(bestStrat.winRate)} win rate and generated a net profit of ${fmtMoney(bestStrat.pnl)}.`,
        value: fmtMoney(bestStrat.pnl)
      })
    }

    if (worstStrat && worstStrat.count >= 2 && worstStrat.pnl < 0) {
      list.push({
        type: 'warning',
        category: 'strategy',
        title: `Underperforming: ${worstStrat.key}`,
        text: `Your ${worstStrat.key} strategy has a ${fmtPct(worstStrat.winRate)} win rate, resulting in a net loss of ${fmtMoney(worstStrat.pnl)}. Consider refining rules or skipping setups.`,
        value: fmtMoney(worstStrat.pnl)
      })
    }
  }

  // 3. Best & Worst Trading Day
  const dayStats = DOW.map((day, i) => {
    const dayTrades = closed.filter(t => {
      const date = new Date(t.exitDate || t.entryDate)
      return date.getDay() === i
    })
    const s = stats(dayTrades)
    return { day, pnl: s.totalPnl, count: s.count, winRate: s.winRate }
  }).filter(d => d.count > 0)

  if (dayStats.length > 0) {
    const sortedDays = [...dayStats].sort((a, b) => b.pnl - a.pnl)
    const bestDay = sortedDays[0]
    const worstDay = sortedDays[sortedDays.length - 1]

    if (bestDay && bestDay.pnl > 0 && bestDay.count >= 2) {
      list.push({
        type: 'success',
        category: 'day',
        title: `Best Trading Day: ${bestDay.day}`,
        text: `Trading on ${bestDay.day} yields your best performance with ${fmtPct(bestDay.winRate)} win rate and ${fmtMoney(bestDay.pnl)} total P&L.`,
        value: fmtMoney(bestDay.pnl)
      })
    }

    if (worstDay && worstDay.pnl < 0 && worstDay.count >= 2) {
      list.push({
        type: 'warning',
        category: 'day',
        title: `Challenging Day: ${worstDay.day}`,
        text: `Your net performance on ${worstDay.day} is ${fmtMoney(worstDay.pnl)} across ${worstDay.count} trades. Consider taking a break or trading smaller size on this day.`,
        value: fmtMoney(worstDay.pnl)
      })
    }
  }

  // 4. Session analysis
  const sessions = ['Asian', 'London', 'New York', 'Other']
  const sessionStats = sessions.map(session => {
    const sessionTrades = closed.filter(t => getSession(t.exitDate || t.entryDate) === session)
    const s = stats(sessionTrades)
    return { session, pnl: s.totalPnl, count: s.count, winRate: s.winRate }
  }).filter(s => s.count > 0)

  if (sessionStats.length >= 2) {
    const sortedSessions = [...sessionStats].sort((a, b) => b.pnl - a.pnl)
    const bestSession = sortedSessions[0]
    const worstSession = sortedSessions[sortedSessions.length - 1]

    if (bestSession && bestSession.pnl > worstSession.pnl && bestSession.count >= 2) {
      const diffWinRate = Math.abs(bestSession.winRate - worstSession.winRate)
      list.push({
        type: 'opportunity',
        category: 'session',
        title: `Session Focus: ${bestSession.session}`,
        text: `Trades during the ${bestSession.session} session outperform ${worstSession.session} by a win rate margin of ${diffWinRate.toFixed(0)}%. Focus your energy when your edge is sharpest.`,
        value: `${bestSession.session}`
      })
    }
  }

  // 5. Emotion vs Performance
  const emotionsList = []
  closed.forEach(t => {
    (t.emotions || []).forEach(e => {
      if (!emotionsList.includes(e)) emotionsList.push(e)
    })
  })

  const emotionStats = emotionsList.map(emotion => {
    const emoTrades = closed.filter(t => (t.emotions || []).includes(emotion))
    const s = stats(emoTrades)
    const losses = emoTrades.map(t => tradePnl(t) || 0).filter(p => p < 0).reduce((sum, p) => sum + p, 0)
    return { emotion, pnl: s.totalPnl, count: s.count, winRate: s.winRate, losses }
  })

  // Look for negative emotional impact
  const negativeEmotions = ['FOMO', 'Revenge', 'Anxious', 'Greedy', 'Impatient', 'Frustrated']
  const badEmoHits = emotionStats
    .filter(es => negativeEmotions.some(ne => ne.toLowerCase() === es.emotion.toLowerCase()))
    .sort((a, b) => a.pnl - b.pnl) // More negative first

  if (badEmoHits.length > 0 && badEmoHits[0].pnl < 0) {
    const worstEmo = badEmoHits[0]
    const emoPctOfLosses = totalLoss ? (worstEmo.losses / totalLoss) * 100 : 0

    if (emoPctOfLosses > 10) {
      list.push({
        type: 'warning',
        category: 'emotion',
        title: `Emotional Cost: ${worstEmo.emotion}`,
        text: `Trades tagged with "${worstEmo.emotion}" account for ${emoPctOfLosses.toFixed(0)}% of your total losses (${fmtMoney(worstEmo.losses)}). Pause and reset before entering when feeling this way.`,
        value: `${emoPctOfLosses.toFixed(0)}% of losses`
      })
    }
  }

  // Look for positive emotional impact
  const positiveEmotions = ['Confident', 'Disciplined', 'Calm', 'Focused']
  const goodEmoHits = emotionStats
    .filter(es => positiveEmotions.some(pe => pe.toLowerCase() === es.emotion.toLowerCase()))
    .sort((a, b) => b.pnl - a.pnl) // More positive first

  if (goodEmoHits.length > 0 && goodEmoHits[0].pnl > 0 && goodEmoHits[0].count >= 2) {
    const bestEmo = goodEmoHits[0]
    list.push({
      type: 'success',
      category: 'emotion',
      title: `State of Flow: ${bestEmo.emotion}`,
      text: `When feeling "${bestEmo.emotion}", you trade with a ${fmtPct(bestEmo.winRate)} win rate and generated ${fmtMoney(bestEmo.pnl)} in profits.`,
      value: `Win Rate: ${fmtPct(bestEmo.winRate)}`
    })
  }

  // 6. Rule Adherence Impact
  const withPlan = closed.filter(t => t.followedPlan != null)
  if (withPlan.length >= 3) {
    const followed = withPlan.filter(t => t.followedPlan === 'yes')
    const broke = withPlan.filter(t => t.followedPlan === 'no')
    const sFollowed = stats(followed)
    const sBroke = stats(broke)

    if (broke.length > 0 && sFollowed.expectancy > sBroke.expectancy) {
      const diffExpectancy = sFollowed.expectancy - sBroke.expectancy
      list.push({
        type: 'warning',
        category: 'plan',
        title: 'Plan Discipline Penalty',
        text: `Breaking your plan costs you an average of ${fmtMoney(diffExpectancy)} per trade compared to when you follow it. Win rate drops from ${fmtPct(sFollowed.winRate)} to ${fmtPct(sBroke.winRate)}.`,
        value: `-${fmtPct(Math.abs(sFollowed.winRate - sBroke.winRate))} win rate`
      })
    } else if (followed.length >= 2 && sFollowed.totalPnl > 0) {
      list.push({
        type: 'success',
        category: 'plan',
        title: 'Disciplined Execution Payoff',
        text: `Following your trading plan generated a total P&L of ${fmtMoney(sFollowed.totalPnl)} with a win rate of ${fmtPct(sFollowed.winRate)}. Keep adhering to your checklist!`,
        value: fmtMoney(sFollowed.totalPnl)
      })
    }
  }

  // 7. Improvement opportunities
  // Check fees leakage
  const totalFees = closed.reduce((sum, t) => sum + (Number(t.fees) || 0), 0)
  const netPnl = overallStats.totalPnl
  if (totalFees > 0 && netPnl > 0 && (totalFees / netPnl) > 0.15) {
    const feeRatio = (totalFees / netPnl) * 100
    list.push({
      type: 'opportunity',
      category: 'improvement',
      title: 'Fee Drag Analysis',
      text: `Your paid fees/commissions (${fmtMoney(totalFees)}) consume ${feeRatio.toFixed(0)}% of your net profits. Review your trade frequency or broker tier.`,
      value: `${feeRatio.toFixed(0)}% of net`
    })
  }

  return list
}
