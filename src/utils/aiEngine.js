// ─────────────────────────────────────────────
// 🧠 SMARTAID AI ENGINE (PRODUCTION READY)
// ─────────────────────────────────────────────

// ═════════════════════════════════════════════
// 📍 DISTANCE (HAVERSINE)
// ═════════════════════════════════════════════
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v == null)) return 999;

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

// ═════════════════════════════════════════════
// 🧠 TYPE NORMALIZATION
// ═════════════════════════════════════════════
export const normalizeType = (t) => {
  if (!t) return 'Other';

  t = t.toLowerCase();

  if (t.includes('doctor') || t.includes('medical')) return 'Medical';
  if (t.includes('food')) return 'Food';
  if (t.includes('water')) return 'Water';
  if (t.includes('teach') || t.includes('education')) return 'Education';

  return 'Other';
};

// ═════════════════════════════════════════════
// 🎯 SKILL MAP
// ═════════════════════════════════════════════
export const skillMap = {
  Medical: ['doctor', 'nurse', 'paramedic', 'pharmacist'],
  Food: ['cook', 'food distribution', 'delivery'],
  Water: ['logistics', 'field worker', 'driver'],
  Education: ['teacher', 'tutor', 'trainer'],
  Technical: ['it support', 'web developer', 'data entry'],
  Legal: ['lawyer', 'documentation'],
  Support: ['caregiver', 'childcare', 'counseling'],
  Media: ['social media', 'content writing', 'translator'],
  Events: ['event management', 'fundraising']
};

// ═════════════════════════════════════════════
// ⚡ PRIORITY SCORE
// ═════════════════════════════════════════════
export function calculatePriorityScore(need) {
  let score = 0;

  if (need.urgency === 'Critical') score += 50;
  else if (need.urgency === 'High') score += 40;
  else score += 20;

  score += Math.min((need.qty || 1) / 10, 1) * 20;

  return Math.round(score);
}

// ═════════════════════════════════════════════
// 🤖 MATCH ENGINE (SMART SCORING)
// ═════════════════════════════════════════════
export function aiMatchVolunteers(need, users) {
  const needType = normalizeType(need.type);
  const validSkills = (skillMap[needType] || []).map(s => s.toLowerCase());

  return users
    .filter(u =>
      (u.role === 'Volunteer' || u.role === 'volunteer') &&
      u.available !== false &&
      (u.assignedCount || 0) < (u.maxTasks || 1)
    )
    .map(v => {
      const skill = (v.skill || '').toLowerCase();

      // 🔥 STRICT SKILL FILTER (MAIN FIX)
      const skillMatch = validSkills.some(s =>
        skill.includes(s) || s.includes(skill)
      );

      if (!skillMatch) return null; // ❌ reject wrong skill completely

      const dist = getDistanceKm(need.lat, need.lng, v.lat, v.lng);

      let score = 0;

      // ✅ FULL skill score
      score += 70;

      // 📍 Distance
      score += Math.max(0, 1 - dist / 30) * 20;

      // ⚖️ Load penalty
      const load = v.assignedCount || 0;
      const capacity = v.maxTasks || 1;

      score -= (load / capacity) * 40;
      score -= load * 10;

      return {
        ...v,
        distance: dist,
        matchScore: Math.max(0, Math.round(score))
      };
    })
    .filter(Boolean) // 🔥 remove nulls
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ═════════════════════════════════════════════
// 🧠 GLOBAL ASSIGNMENT ENGINE (NO DUPLICATION)
// ═════════════════════════════════════════════
export function optimizeAssignments(needs, users, strictSingleTask = true) {

  const sortedNeeds = [...needs]
    .map(n => ({ ...n, priority: calculatePriorityScore(n) }))
    .sort((a, b) => b.priority - a.priority);

  const assignments = [];
  const loadMap = new Map();

  // initialize loads
  users.forEach(u => {
    loadMap.set(u.id, u.assignedCount || 0);
  });

  sortedNeeds.forEach(need => {

    const required = need.requiredVolunteers || 1;

    // 🔥 dynamic users (IMPORTANT FIX)
    const dynamicUsers = users.map(u => ({
      ...u,
      assignedCount: loadMap.get(u.id) || 0
    }));

    const matches = aiMatchVolunteers(need, dynamicUsers);

    const selected = [];

    for (let v of matches) {

      const current = loadMap.get(v.id) || 0;
      const max = v.maxTasks || 1;

      // 🔒 STRICT MODE → only 1 task EVER
      if (strictSingleTask) {
        if (current === 0) {
          selected.push(v);
          loadMap.set(v.id, 1);
        }
      } else {
        // 🧠 Smart mode
        if (need.priority > 60) {
          if (current === 0) {
            selected.push(v);
            loadMap.set(v.id, current + 1);
          }
        } else {
          if (current < max) {
            selected.push(v);
            loadMap.set(v.id, current + 1);
          }
        }
      }

      if (selected.length >= required) break;
    }

    if (selected.length > 0) {
      assignments.push({
        needId: need.id,
        volunteers: selected
      });
    }
  });

  return assignments;
}

// ═════════════════════════════════════════════
// 🗺️ HEAT MAP
// ═════════════════════════════════════════════
export function generateHeatMapData(needs) {
  return needs
    .filter(n => n.lat && n.lng)
    .map(n => ({
      lat: n.lat,
      lng: n.lng,
      weight: Math.min((n.qty || 1) / 50, 1),
      type: normalizeType(n.type),
      urgency: n.urgency,
      id: n.id
    }));
}

// ═════════════════════════════════════════════
// 📊 AGGREGATION
// ═════════════════════════════════════════════
export function aggregateNeedsData(needs = [], users = []) {

  const byType = {};
  let criticalUnassigned = 0;

  needs.forEach(n => {
    const type = normalizeType(n.type);

    if (!byType[type]) {
      byType[type] = {
        count: 0,
        pending: 0,
        critical: 0,
        totalQty: 0
      };
    }

    byType[type].count++;
    byType[type].totalQty += n.qty || 1;

    if (n.status === 'Pending') byType[type].pending++;
    if (n.urgency === 'Critical') byType[type].critical++;

    if (
      (n.urgency === 'Critical' || n.urgency === 'High') &&
      n.status === 'Pending'
    ) {
      criticalUnassigned++;
    }
  });

  const volunteers = users.filter(u =>
    u.role === 'Volunteer' || u.role === 'volunteer'
  );

  return {
    byType,
    criticalUnassigned,
    availableVolunteers: volunteers.filter(v => v.available !== false).length
  };
}

// ═════════════════════════════════════════════
// 📈 RISK PREDICTION
// ═════════════════════════════════════════════
export function predictHighRiskAreas(needs) {
  return needs
    .filter(n => n.lat && n.lng)
    .map(n => ({
      lat: n.lat,
      lng: n.lng,
      riskScore: calculatePriorityScore(n),
      type: normalizeType(n.type),
      urgency: n.urgency,
      id: n.id
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
}