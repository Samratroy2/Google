// ── Helper Utilities ──────────────────────────────────────────────────────────

/**
 * Format a date string into relative time
 */
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Generate initials from full name
 */
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Clamp a number between min and max
 */
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Format score as percentage string
 */
export function formatScore(score) {
  return `${Math.round(score * 100)}%`;
}

/**
 * Get color for a score value
 */
export function scoreColor(score) {
  if (score >= 0.85) return '#22c55e';
  if (score >= 0.65) return '#f59e0b';
  return '#ef4444';
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate random ID
 */
export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
