// ── Helper Utilities ─────────────────────────────────────────

// ⏱ Format time ago
export function timeAgo(dateStr) {
  if (!dateStr) return "Just now";

  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// 👤 Initials
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// 📊 Score formatting
export function formatScore(score) {
  return `${Math.round(score * 100)}%`;
}

// 🎨 Score color
export function scoreColor(score) {
  if (score >= 0.85) return '#22c55e';
  if (score >= 0.65) return '#f59e0b';
  return '#ef4444';
}

// 🔢 Clamp
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}