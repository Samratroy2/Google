// ── AI ENGINE (ENHANCED — capacity-aware allocation) ─────────

// ══════════════════════════════════════════════════════════════
// 📍 HAVERSINE DISTANCE
// ══════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════
// 🧠 TYPE NORMALIZATION
// ══════════════════════════════════════════════════════════════
export const normalizeType = (t) => {
  if (!t) return 'Other';
  t = t.toLowerCase();
  if (t.includes('doctor') || t.includes('medical')) return 'Medical';
  if (t.includes('food')) return 'Food';
  if (t.includes('water')) return 'Water';
  if (t.includes('teach') || t.includes('education')) return 'Education';
  return 'Other';
};

// ══════════════════════════════════════════════════════════════
// 🎯 SKILL MAP
// ══════════════════════════════════════════════════════════════
export const skillMap = {
  Medical: ['doctor', 'nurse'],
  Food: ['cook', 'delivery'],
  Water: ['logistics', 'field worker'],
  Education: ['teacher']
};

// ══════════════════════════════════════════════════════════════
// 🧠 PRIORITY SCORE
// ══════════════════════════════════════════════════════════════
export function calculatePriorityScore(need) {
  let score = 0;
  if (need.urgency === 'Critical') score += 50;
  else if (need.urgency === 'High') score += 40;
  else score += 20;

  score += Math.min((need.qty || 1) / 10, 1) * 20;
  return Math.round(score);
}

// ══════════════════════════════════════════════════════════════
// 🤖 MATCH ENGINE (UPDATED — capacity aware)
// ══════════════════════════════════════════════════════════════
export function aiMatchVolunteers(need, users) {
  const needType = normalizeType(need.type);
  const validSkills = (skillMap[needType] || []).map(s => s.toLowerCase());

  return users
    .filter(u =>
      (u.role === 'Volunteer' || u.role === 'volunteer') &&
      u.available !== false &&
      (u.assignedCount || 0) < (u.maxTasks || 1) // ✅ CAPACITY FILTER
    )
    .map(v => {
      const dist = getDistanceKm(need.lat, need.lng, v.lat, v.lng);
      const skill = (v.skill || '').toLowerCase();

      let score = 0;

      // skill
      if (validSkills.includes(skill)) score += 70;
      else score += 30;

      // distance
      score += Math.max(0, 1 - dist / 30) * 20;

      // workload penalty
      const load = v.assignedCount || 0;
      const capacity = v.maxTasks || 1;
      score -= (load / capacity) * 30;

      return {
        ...v,
        distance: dist,
        matchScore: Math.max(0, Math.round(score))
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ══════════════════════════════════════════════════════════════
// 🧠 GLOBAL ASSIGNMENT ENGINE (FIXED)
// ══════════════════════════════════════════════════════════════
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

    const matches = aiMatchVolunteers(need, users);

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


// ══════════════════════════════════════════════════════════════
// 🗺️ HEAT MAP DATA
// ══════════════════════════════════════════════════════════════
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


// ══════════════════════════════════════════════════════════════
// 📊 DATA AGGREGATION
// ══════════════════════════════════════════════════════════════
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

  // ✅ AREA CLUSTERS (simple version)
  const areaSeverity = needs
    .filter(n => n.lat && n.lng)
    .map(n => ({
      center: { lat: n.lat, lng: n.lng },
      needs: [n],
      severityScore: calculatePriorityScore(n),
      dominantType: normalizeType(n.type),
      riskLevel:
        calculatePriorityScore(n) > 70
          ? 'High'
          : calculatePriorityScore(n) > 40
          ? 'Medium'
          : 'Low'
    }));

  // ✅ COVERAGE GAPS
  const volunteers = users.filter(u =>
    u.role === 'Volunteer' || u.role === 'volunteer'
  );

  const coverageGaps = Object.keys(byType).filter(type => {
    const skills = (skillMap[type] || []).map(s => s.toLowerCase());

    const hasVolunteer = volunteers.some(v =>
      skills.includes((v.skill || '').toLowerCase())
    );

    return !hasVolunteer && byType[type].pending > 0;
  });

  return {
    byType,
    areaSeverity,
    coverageGaps,
    criticalUnassigned,
    completionRate: 0,
    availableVolunteers: volunteers.filter(v => v.available !== false).length,
    trend: { change: 0 }
  };
}

// ══════════════════════════════════════════════════════════════
// 📈 RISK PREDICTION (simple version)
// ══════════════════════════════════════════════════════════════
export function predictHighRiskAreas(needs) {
  return needs
    .filter(n => n.lat && n.lng)
    .map(n => ({
      lat: n.lat,
      lng: n.lng,
      riskScore: calculatePriorityScore(n),
      type: normalizeType(n.type)
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
}