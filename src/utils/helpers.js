// ⏱ TIME AGO (MORE ROBUST)
export function timeAgo(ts) {
  if (!ts) return "Just now";

  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date)) return "Just now";

  const diff = Date.now() - date.getTime();

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;

  // 🔥 fallback for older dates
  return date.toLocaleDateString();
}


// 👤 INITIALS (STRONGER)
export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return '?';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}


// 📊 SCORE FORMAT (SAFE)
export function formatScore(score) {
  const val = typeof score === 'number' ? score : 0;
  return `${Math.round(val)}%`;
}


// 🎨 SCORE COLOR (SMOOTHER SCALE)
export function scoreColor(score) {
  const val = typeof score === 'number' ? score : 0;

  if (val >= 85) return '#22c55e';   // green
  if (val >= 65) return '#eab308';   // yellow (better than orange)
  if (val >= 40) return '#f97316';    // orange
  return '#ef4444';                    // red
}

export function getMatchReason(v) {
  if (v.matchScore > 85) return "Top-tier specialist nearby";
  if (v.skillMatch === 'partial' && v.distance < 5) return "Generalist in immediate proximity";
  return "Available backup resource";
}