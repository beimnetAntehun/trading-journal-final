import Dexie from 'dexie'

const DB_NAME = 'trading-journal-db'

export const db = new Dexie(DB_NAME)

db.version(1).stores({
  trades: 'id, accountId, date, symbol, direction, entry, exit, stopLoss, takeProfit, size, fees, pnl, rMultiple, setup, notes, imageBlob',
  accounts: 'id, name, initialBalance, currency',
  settings: 'key, value',
})

export function migrateLocalStorageToIndexedDb() {
  if (typeof window === 'undefined') return Promise.resolve(false)

  const key = 'trading-journal:v1'
  const raw = localStorage.getItem(key)
  if (!raw) return Promise.resolve(false)

  try {
    const parsed = JSON.parse(raw)
    const queue = []

    if (Array.isArray(parsed.trades)) {
      queue.push(
        db.trades.bulkPut(
          parsed.trades.map((trade) => ({
            ...trade,
            imageBlob: trade.entryShot || trade.exitShot || null,
            date: trade.entryDate || trade.exitDate || new Date().toISOString(),
            entry: trade.entryPrice ?? trade.entry ?? null,
            exit: trade.exitPrice ?? trade.exit ?? null,
            stopLoss: trade.stopLoss ?? null,
            takeProfit: trade.takeProfit ?? null,
            size: trade.size ?? null,
            fees: trade.fees ?? 0,
            pnl: trade.pnl ?? null,
            rMultiple: trade.rMultiple ?? null,
            setup: trade.strategy ?? '',
            notes: trade.notes ?? '',
          }))
        )
      )
    }

    if (Array.isArray(parsed.accounts)) {
      queue.push(db.accounts.bulkPut(parsed.accounts.map((account) => ({
        id: account.id,
        name: account.name,
        initialBalance: account.startingBalance ?? account.initialBalance ?? 0,
        currency: account.currency ?? 'USD',
      }))))
    }

    if (parsed.settings) {
      queue.push(
        db.settings.bulkPut(
          Object.entries(parsed.settings).map(([key, value]) => ({ key, value }))
        )
      )
    }

    return Promise.all(queue)
      .then(() => {
        localStorage.removeItem(key)
        return true
      })
      .catch((error) => {
        console.error('IndexedDB migration failed', error)
        return false
      })
  } catch (error) {
    console.error('Failed to parse localStorage journal state', error)
    return Promise.resolve(false)
  }
}

export function saveBlobImage(dataUrl) {
  if (!dataUrl) return Promise.resolve(null)

  return fetch(dataUrl)
    .then((response) => response.blob())
    .then((blob) => blob)
    .catch(() => null)
}
