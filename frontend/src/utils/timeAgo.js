/**
 * Returns a human-readable "time ago" string using Intl.RelativeTimeFormat.
 * @param {Date} timestamp - The date to compare against now.
 * @param {string} [locale='en'] - BCP 47 locale tag (e.g. 'en', 'th').
 * @returns {string}
 */
export const timeAgo = (timestamp, locale = 'en') => {
  const diff = (new Date().getTime() - timestamp.getTime()) / 1000
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (years > 0) return rtf.format(-years, 'year')
  if (months > 0) return rtf.format(-months, 'month')
  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return rtf.format(0 - Math.floor(diff), 'second')
}
