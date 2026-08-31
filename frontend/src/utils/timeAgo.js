/**
 * Returns a human-readable "time ago" string using Intl.RelativeTimeFormat.
 * @param {Date} timestamp - The date to compare against now.
 * @param {string} [locale='en'] - BCP 47 locale tag (e.g. 'en', 'th').
 * @returns {string}
 */
export const timeAgo = (timestamp, locale = "en") => {
  const diffMs = new Date().getTime() - timestamp.getTime();
  const diffSec = diffMs / 1000;
  const absSec = Math.abs(diffSec);
  const sign = diffSec >= 0 ? -1 : 1; // negative = past, positive = future

  const absMinutes = Math.floor(absSec / 60);
  const absHours = Math.floor(absMinutes / 60);
  const absDays = Math.floor(absHours / 24);
  const absMonths = Math.floor(absDays / 30);
  const absYears = Math.floor(absMonths / 12);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absYears > 0) return rtf.format(sign * absYears, "year");
  if (absMonths > 0) return rtf.format(sign * absMonths, "month");
  if (absDays > 0) return rtf.format(sign * absDays, "day");
  if (absHours > 0) return rtf.format(sign * absHours, "hour");
  if (absMinutes > 0) return rtf.format(sign * absMinutes, "minute");
  return rtf.format(sign * Math.floor(absSec), "second");
};
