/**
 * Format time string for display
 */
export function formatTime(timeString?: string): string {
  if (!timeString) return ''
  const date = new Date(timeString)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Format local time to YYYY-MM-DDTHH:MM string
 */
export function formatLocalTime(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const HH = String(date.getHours()).padStart(2, '0')
  const MM = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
}

/**
 * Initialize current time as local string
 */
export function getCurrentLocalTimeString(): string {
  return formatLocalTime(new Date())
}