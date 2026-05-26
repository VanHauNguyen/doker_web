export const money = (value: unknown): string => {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0)
}

export const dateTime = (value?: string | null): string => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const normalizeList = <T>(payload: T[] | { data: T[] }): T[] =>
  Array.isArray(payload) ? payload : payload.data

export const asString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}
