/**
 * Parse a date string to a Date object.
 * Supports DD/MM/YY format and relative strings like "yesterday", "last month", etc.
 */
export const parseDate = (value: string): Date | null => {
  // Try DD/MM/YY format first
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const match = value.match(dateRegex);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = parseInt(year, 10) + 2000;
    return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Try relative dates
  const now = new Date();
  const lower = value.toLowerCase().trim();

  if (lower === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (lower === 'last week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (lower === 'last month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Try "X hours/days/weeks ago" pattern
  const agoRegex = /^(\d+)\s+(hour|day|week|month)s?\s+ago$/;
  const agoMatch = lower.match(agoRegex);
  if (agoMatch) {
    const amount = parseInt(agoMatch[1], 10);
    const unit = agoMatch[2];
    const d = new Date(now);

    switch (unit) {
      case 'hour':
        d.setHours(d.getHours() - amount);
        break;
      case 'day':
        d.setDate(d.getDate() - amount);
        break;
      case 'week':
        d.setDate(d.getDate() - amount * 7);
        break;
      case 'month':
        d.setMonth(d.getMonth() - amount);
        break;
    }
    return d;
  }

  // Try native Date parsing
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

/**
 * Format a date as relative time string (e.g., "2 hours ago", "yesterday")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365)
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;

  return d.toLocaleDateString();
};
