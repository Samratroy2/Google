// ── AI ENGINE (FINAL - FIXED SKILL SCORING) ─────────────────────────


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

  if (t.includes('medical') || t.includes('doctor') || t.includes('injury')) return 'Medical';
  if (t.includes('food') || t.includes('meal') || t.includes('hungry')) return 'Food';
  if (t.includes('water') || t.includes('thirst')) return 'Water';
  if (t.includes('shelter') || t.includes('home')) return 'Shelter';

  if (t.includes('teach') || t.includes('education')) return 'Education';
  if (t.includes('legal') || t.includes('law')) return 'Legal';
  if (t.includes('tech') || t.includes('computer')) return 'Technical';
  if (t.includes('social') || t.includes('media')) return 'Communication';
  if (t.includes('counsel') || t.includes('care')) return 'Support';
  if (t.includes('event') || t.includes('fund')) return 'Operations';
  if (t.includes('online') || t.includes('remote')) return 'Remote';

  return 'Other';
};


// 🎯 SKILL MAP
const skillMap = {
  Medical: ['Doctor', 'Nurse', 'Paramedic', 'Pharmacist'],
  Food: ['Cook', 'Food distribution', 'Delivery'],
  Water: ['Field worker', 'Logistics', 'Driver'],
  Shelter: ['Field worker', 'Logistics', 'Driver', 'Caregiver'],
  Education: ['Teacher', 'Tutor', 'Trainer'],
  Legal: ['Lawyer', 'Documentation'],
  Technical: ['IT Support', 'Web Developer', 'Data Entry'],
  Communication: ['Social Media', 'Content Writing', 'Translator'],
  Support: ['Counseling', 'Childcare', 'Caregiver'],
  Operations: ['Admin Support', 'Event Management', 'Fundraising'],
  Remote: ['Online volunteer']
};


// 🤖 MATCH ENGINE
export function aiMatchVolunteers(need, users) {

  const volunteers = users.filter(
    u => u.role === "Volunteer" && u.status === "approved"
  );

  if (!need.lat || !need.lng) return [];

  const needType = normalizeType(need.type);

  return volunteers
    .map(v => {

      if (v.available === false) return null;

      const dist = getDistanceKm(need.lat, need.lng, v.lat, v.lng);

      let score = 0;

      // ✅ FIX: use directly (no import)
      const priority = calculatePriorityScore(need);

      const validSkills = skillMap[needType] || [];
      const userSkill = (v.skill || '').toLowerCase();

      const validSet = validSkills.map(s => s.toLowerCase());

      // 🎯 SKILL SCORING (FIXED)
      if (validSet.includes(userSkill)) {
        score += 70;
      } else {
        score += 20;
      }

      // 📍 DISTANCE (0–20)
      const distScore = Math.max(0, 1 - (dist / 15));
      score += distScore * 20;

      // 📊 EXPERIENCE (0–10)
      const exp = Math.log1p(v.tasksCompleted || 0) / Math.log(20);
      score += Math.min(exp, 1) * 10;

      // ⚡ URGENCY BONUS
      if (need.urgency === 'Critical') score += 5;
      else if (need.urgency === 'High') score += 3;

      // 🆕 PRIORITY BOOST
      score += priority * 0.2;

      return {
        ...v,
        distance: +dist.toFixed(2),
        matchScore: Math.round(score)
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.distance - b.distance;
    });
}


// ── NLP ENGINE ─────────────────────────


// 🔤 CLEAN TEXT
const cleanText = (text = "") =>
  text.toLowerCase().replace(/[^\w\s]/g, '');


// 🧠 CATEGORY KEYWORDS
const CATEGORY_KEYWORDS = {
  Food: ['food', 'meal', 'rice', 'hungry', 'eat'],
  Water: ['water', 'drink', 'thirst'],
  Medical: ['doctor', 'medical', 'injury', 'hospital', 'medicine'],
  Shelter: ['shelter', 'home', 'house', 'roof'],

  Education: ['teach', 'education', 'school'],
  Legal: ['legal', 'law', 'case'],
  Technical: ['tech', 'computer', 'system'],
  Communication: ['social', 'media', 'translate'],
  Support: ['counsel', 'care', 'support'],
  Operations: ['event', 'fund', 'management'],
  Remote: ['online', 'remote']
};


// 🚨 URGENCY KEYWORDS
const URGENCY_KEYWORDS = {
  Critical: ['critical', 'emergency', 'dying'],
  High: ['urgent', 'asap'],
  Medium: ['need', 'help'],
  Low: ['later']
};


// 🔍 CATEGORY MATCH
function matchCategory(text) {
  let best = 'Other';
  let max = 0;

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    words.forEach(w => {
      if (text.includes(w)) score += 2;
    });

    if (score > max) {
      max = score;
      best = cat;
    }
  }

  return best;
}


// 🔍 URGENCY MATCH
function matchUrgency(text) {
  for (const [level, words] of Object.entries(URGENCY_KEYWORDS)) {
    if (words.some(w => text.includes(w))) return level;
  }
  return 'Medium';
}


// 🔢 QUANTITY
function extractQuantity(text) {
  const match = text.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}


// 🤖 NLP MAIN
export function nlpClassify(text) {
  const t = cleanText(text);

  return {
    category: matchCategory(t),
    urgency: matchUrgency(t),
    qty: extractQuantity(t)
  };
}


// 🎯 URGENCY SCORE
export function detectUrgencyScore(text) {
  const t = cleanText(text);

  if (/critical|emergency/.test(t)) return 95;
  if (/urgent|asap/.test(t)) return 80;
  if (/help|need/.test(t)) return 60;

  return 30;
}


// ── PRIORITY ENGINE ─────────────────────────


// 🧠 GLOBAL PRIORITY SCORE
export function calculatePriorityScore(need) {
  let score = 0;

  if (need.urgency === "Critical") score += 50;
  else if (need.urgency === "High") score += 40;
  else if (need.urgency === "Medium") score += 25;
  else score += 10;

  const qty = need.qty || 1;
  score += Math.min(qty / 10, 1) * 20;

  if (need.createdAt) {
    const ts = need.createdAt?.toDate?.() || new Date(need.createdAt);
    const ageHours = (Date.now() - ts.getTime()) / 3600000;
    score += Math.min(ageHours / 24, 1) * 15;
  }

  if (need.status === "Pending") score += 10;

  return Math.round(score);
}


// 🧠 AUTO RESOURCE ALLOCATION
export function optimizeAssignments(needs, users) {
  const sortedNeeds = [...needs]
    .map(n => ({
      ...n,
      priorityScore: calculatePriorityScore(n)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const assignments = [];

  sortedNeeds.forEach(need => {
    const matches = aiMatchVolunteers(need, users);

    if (matches.length > 0) {
      assignments.push({
        needId: need.id,
        volunteer: matches[0],
        priority: need.priorityScore
      });
    }
  });

  return assignments;
}