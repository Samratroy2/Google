// ─────────────────────────────────────────────
// 🧠 SMARTAID AI ENGINE (FRONTEND SIDE)
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
// 🎯 ALL SKILLS (MATCH WITH DROPDOWN)
// ═════════════════════════════════════════════
export const ALL_SKILLS = [
  "doctor", "nurse", "paramedic", "pharmacist", "counselor", "caregiver",
  "childcare support",
  "teacher", "tutor", "trainer",
  "logistics", "driver", "field worker", "delivery support",
  "cook", "food distribution",
  "it support", "web developer", "data entry",
  "lawyer", "documentation",
  "admin support",
  "social media manager", "content writer", "translator",
  "online volunteer",
  "event management", "fundraising",
  "other"
];


// ═════════════════════════════════════════════
// 🧠 EXTRACT EXACT ROLE FROM TEXT
// ═════════════════════════════════════════════
export function extractExactRole(text = "") {
  text = text.toLowerCase();

  const sorted = [...ALL_SKILLS].sort((a, b) => b.length - a.length);

  for (let skill of sorted) {
    if (text.includes(skill)) {
      return skill;
    }
  }

  return null;
}


// ═════════════════════════════════════════════
// ⚡ PRIORITY SCORE
// ═════════════════════════════════════════════
export function calculatePriorityScore(need) {
  let score = 0;

  if (need.urgency === "Critical") score += 50;
  else if (need.urgency === "High") score += 40;
  else score += 20;

  score += Math.min((need.qty || 1) / 10, 1) * 20;

  return Math.round(score);
}


// ═════════════════════════════════════════════
// 🤖 STRICT MATCH ENGINE
// ═════════════════════════════════════════════
export function aiMatchVolunteers(need, users) {
  const requiredRole =
    (need.role || extractExactRole(need.title + " " + need.description) || "")
      .toLowerCase();

  return users
    .filter(u =>
      (u.role === "Volunteer" || u.role === "volunteer") &&
      u.available !== false &&
      (u.assignedCount || 0) < (u.maxTasks || 1)
    )
    .map(v => {
      const skill = (v.skill || "").toLowerCase().trim();

      // 🔥 STRICT MATCH ONLY
      if (!requiredRole || skill !== requiredRole) {
        return null;
      }

      const dist = getDistanceKm(need.lat, need.lng, v.lat, v.lng);

      let score = 0;

      // 🎯 perfect role match
      score += 100;

      // 📍 distance score
      score += Math.max(0, 1 - dist / 30) * 20;

      // ⚖️ load balancing
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
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore);
}


// ═════════════════════════════════════════════
// 🔄 MATCH WITH FALLBACK
// ═════════════════════════════════════════════
export function aiMatchWithFallback(need, users) {
  let matches = aiMatchVolunteers(need, users);

  if (matches.length === 0) {
    console.log("⚠️ No exact role match → fallback");

    return users
      .filter(u =>
        (u.role === "Volunteer" || u.role === "volunteer") &&
        u.available !== false
      )
      .map(v => ({
        ...v,
        matchScore: 30
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  return matches;
}


// ═════════════════════════════════════════════
// 🧠 GLOBAL ASSIGNMENT ENGINE
// ═════════════════════════════════════════════
export function optimizeAssignments(needs, users) {
  const sortedNeeds = [...needs]
    .map(n => ({ ...n, priority: calculatePriorityScore(n) }))
    .sort((a, b) => b.priority - a.priority);

  const assignments = [];
  const loadMap = new Map();

  users.forEach(u => {
    loadMap.set(u.id, u.assignedCount || 0);
  });

  sortedNeeds.forEach(need => {
    const required = need.requiredVolunteers || 1;

    const dynamicUsers = users.map(u => ({
      ...u,
      assignedCount: loadMap.get(u.id) || 0
    }));

    const matches = aiMatchWithFallback(need, dynamicUsers);

    const selected = [];

    for (let v of matches) {
      const current = loadMap.get(v.id) || 0;
      const max = v.maxTasks || 1;

      if (current < max) {
        selected.push(v);
        loadMap.set(v.id, current + 1);
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
      type: n.type,
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
    const type = n.type || "Other";

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

    if (n.status === "Pending") byType[type].pending++;
    if (n.urgency === "Critical") byType[type].critical++;

    if (
      (n.urgency === "Critical" || n.urgency === "High") &&
      n.status === "Pending"
    ) {
      criticalUnassigned++;
    }
  });

  const volunteers = users.filter(
    u => u.role === "Volunteer" || u.role === "volunteer"
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
      type: n.type,
      urgency: n.urgency,
      id: n.id
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
}