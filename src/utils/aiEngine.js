// ── AI ENGINE (FINAL CLEAN) ─────────────────────────

// 📍 HAVERSINE DISTANCE
function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 999;

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 🧠 TYPE NORMALIZATION
const normalizeType = (t) => {
  if (!t) return 'Other';

  t = t.toLowerCase();

  if (t.includes('medical') || t.includes('doctor')) return 'Medical';
  if (t.includes('food')) return 'Food';
  if (t.includes('water')) return 'Water';
  if (t.includes('shelter')) return 'Shelter';

  return 'Other';
};

// 🤖 MATCH ENGINE
export function aiMatchVolunteers(need, users) {

  const volunteers = users.filter(
    u => u.role === "Volunteer" && u.status === "approved"
  );

  if (!need.lat || !need.lng) {
    console.warn("Need missing coordinates");
    return [];
  }

  return volunteers
    .map(v => {

      if (v.available === false) return null;

      const dist = getDistanceKm(
        need.lat,
        need.lng,
        v.lat,
        v.lng
      );

      let score = 0;

      // 🧠 Skill match
      if (normalizeType(need.type) === "Medical" && v.skill === "Doctor")
        score += 0.7;
      else
        score += 0.3;

      // 📍 Distance score
      let distScore =
        dist <= 1 ? 1 :
        dist <= 3 ? 0.8 :
        dist <= 5 ? 0.6 :
        dist <= 10 ? 0.4 :
        0.2;

      score += distScore * 0.2;

      // 📊 Experience
      const exp = Math.min(1, (v.tasksCompleted || 0) / 20);
      score += exp * 0.1;

      return {
        ...v,
        distance: +dist.toFixed(2),
        matchScore: +score.toFixed(2)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
}


// ── NLP ─────────────────────────

export function nlpClassify(text) {
  const t = text.toLowerCase();

  let category = 'Other';

  if (/food|meal|rice/.test(t)) category = 'Food';
  else if (/water/.test(t)) category = 'Water';
  else if (/doctor|medical/.test(t)) category = 'Medical';
  else if (/shelter/.test(t)) category = 'Shelter';

  let urgency = 'Medium';

  if (/critical|emergency/.test(t)) urgency = 'Critical';
  else if (/urgent/.test(t)) urgency = 'High';
  else if (/low/.test(t)) urgency = 'Low';

  const qty = parseInt(t.match(/\d+/)?.[0]) || null;

  return { category, urgency, qty };
}

export function detectUrgencyScore(text) {
  const t = text.toLowerCase();

  if (/critical|emergency/.test(t)) return 95;
  if (/urgent/.test(t)) return 80;
  if (/help|need/.test(t)) return 60;

  return 30;
}