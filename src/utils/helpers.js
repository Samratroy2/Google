// ⏱ TIME AGO (SAFE FOR FIRESTORE + STRING)
export function timeAgo(ts) {
  if (!ts) return "Just now";

  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// 👤 INITIALS (SAFE)
export function getInitials(name = '') {
  if (!name) return '?';

  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// 📊 SCORE FORMAT
export function formatScore(score) {
  return `${Math.round((score || 0) * 100)}%`;
}

// 🎨 SCORE COLOR
export function scoreColor(score) {
  if (score >= 0.85) return '#22c55e';
  if (score >= 0.65) return '#f59e0b';
  return '#ef4444';
}