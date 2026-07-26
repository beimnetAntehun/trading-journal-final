// src/lib/csv.js
// Minimal, dependency-free CSV parse/stringify with RFC-4180 quote handling.

export function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cur); cur = ''
      rows.push(row); row = []
    } else cur += ch
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  const headers = (rows.shift() || []).map((h) => h.trim())
  return { headers, rows: rows.filter((r) => r.some((c) => c !== '')) }
}

export function rowsToObjects(headers, rows) {
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
}

export function toCsv(headers, records) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = headers.map(esc).join(',')
  const body = records.map((rec) => headers.map((h) => esc(rec[h])).join(',')).join('\n')
  return head + '\n' + body
}

export function download(filename, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}