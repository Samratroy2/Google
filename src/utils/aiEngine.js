// ── AI ENGINE (ENHANCED — Solution Challenge 2026 Compliant) ─────────────────


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
  if (t.includes('medical') || t.includes('doctor') || t.includes('injury') || t.includes('health')) return 'Medical';
  if (t.includes('food') || t.includes('meal') || t.includes('hungry') || t.includes('nutrition')) return 'Food';
  if (t.includes('water') || t.includes('thirst') || t.includes('flood')) return 'Water';
  if (t.includes('shelter') || t.includes('home') || t.includes('housing') || t.includes('displaced')) return 'Shelter';
  if (t.includes('teach') || t.includes('education') || t.includes('school')) return 'Education';
  if (t.includes('legal') || t.includes('law')) return 'Legal';
  if (t.includes('tech') || t.includes('computer') || t.includes('it')) return 'Technical';
  if (t.includes('social') || t.includes('media') || t.includes('translat')) return 'Communication';
  if (t.includes('counsel') || t.includes('care') || t.includes('support')) return 'Support';
  if (t.includes('event') || t.includes('fund') || t.includes('logistics')) return 'Operations';
  if (t.includes('online') || t.includes('remote')) return 'Remote';
  if (t.includes('cloth') || t.includes('apparel')) return 'Clothing';
  if (t.includes('transport') || t.includes('vehicle') || t.includes('ambulance')) return 'Transport';
  if (t.includes('electric') || t.includes('power') || t.includes('utilities')) return 'Utilities';
  return 'Other';
};


// ══════════════════════════════════════════════════════════════
// 🎯 SKILL MAP — extended for better coverage
// ══════════════════════════════════════════════════════════════
export const skillMap = {
  Medical:       ['Doctor', 'Nurse', 'Paramedic', 'Pharmacist', 'First Aid', 'Surgery'],
  Food:          ['Cook', 'Food distribution', 'Delivery', 'Catering', 'Nutrition'],
  Water:         ['Field worker', 'Logistics', 'Driver', 'Sanitation', 'Plumbing'],
  Shelter:       ['Field worker', 'Logistics', 'Driver', 'Caregiver', 'Construction', 'Carpenter'],
  Education:     ['Teacher', 'Tutor', 'Trainer'],
  Legal:         ['Lawyer', 'Documentation'],
  Technical:     ['IT Support', 'Web Developer', 'Data Entry', 'Networking'],
  Communication: ['Social Media', 'Content Writing', 'Translator'],
  Support:       ['Counseling', 'Childcare', 'Caregiver'],
  Operations:    ['Admin Support', 'Event Management', 'Fundraising'],
  Remote:        ['Online volunteer'],
  Clothing:      ['Tailoring', 'Distribution'],
  Transport:     ['Driver', 'Logistics', 'Vehicle'],
  Utilities:     ['Electrician', 'Plumbing', 'IT Support'],
};


// ══════════════════════════════════════════════════════════════
// 🧠 GLOBAL PRIORITY SCORE — multi-factor
// ══════════════════════════════════════════════════════════════
export function calculatePriorityScore(need) {
  let score = 0;

  // Urgency (0–50)
  if (need.urgency === 'Critical') score += 50;
  else if (need.urgency === 'High')     score += 40;
  else if (need.urgency === 'Medium')   score += 25;
  else                                  score += 10;

  // Quantity impact (0–20)
  const qty = need.qty || 1;
  score += Math.min(qty / 10, 1) * 20;

  // Age penalty — older unresolved = more urgent (0–15)
  if (need.createdAt) {
    const ts = need.createdAt?.toDate?.() || new Date(need.createdAt);
    const ageHours = (Date.now() - ts.getTime()) / 3600000;
    score += Math.min(ageHours / 24, 1) * 15;
  }

  // Status bonus for pending
  if (need.status === 'Pending') score += 10;

  // Vulnerability bonus
  if (need.vulnerableGroup) score += 8;

  // Type criticality bonus
  const criticalTypes = ['Medical', 'Water', 'Shelter'];
  if (criticalTypes.includes(normalizeType(need.type))) score += 5;

  return Math.round(score);
}


// ══════════════════════════════════════════════════════════════
// 🤖 AI MATCH ENGINE — skill + proximity + experience + priority
// ══════════════════════════════════════════════════════════════
export function aiMatchVolunteers(need, users) {
  const volunteers = users.filter(
    u => (u.role === 'Volunteer' || u.role === 'volunteer') &&
         (u.status === 'approved' || !u.status) &&
         u.available !== false
  );

  if (!need.lat || !need.lng) return volunteers.map(v => ({ ...v, matchScore: 50, distance: 0 }));

  const needType   = normalizeType(need.type);
  const priority   = calculatePriorityScore(need);
  const validSkills = (skillMap[needType] || []).map(s => s.toLowerCase());

  return volunteers
    .map(v => {
      const dist      = getDistanceKm(need.lat, need.lng, v.lat, v.lng);
      const userSkill = (v.skill || '').toLowerCase();
      const subSkills = (v.subSkills || []).map(s => s.toLowerCase());
      const allSkills = [userSkill, ...subSkills];

      let score = 0;

      // 🎯 Skill scoring (0–70): exact match vs partial vs none
      const exactMatch   = allSkills.some(s => validSkills.includes(s));
      const partialMatch = allSkills.some(s => validSkills.some(vs => vs.includes(s) || s.includes(vs)));

      if (exactMatch)        score += 70;
      else if (partialMatch) score += 45;
      else                   score += 15;

      // 📍 Proximity score (0–20): linear decay over 30km
      const distScore = Math.max(0, 1 - dist / 30);
      score += distScore * 20;

      // 📊 Experience score (0–10)
      const exp = Math.log1p(v.tasksCompleted || 0) / Math.log(20);
      score += Math.min(exp, 1) * 10;

      // ⭐ Rating bonus (0–5)
      if (v.rating) score += Math.min(v.rating / 5, 1) * 5;

      // ⚡ Urgency amplifier
      if (need.urgency === 'Critical') score += 8;
      else if (need.urgency === 'High') score += 5;

      // 🆕 Priority boost (scaled)
      score += priority * 0.15;

      return {
        ...v,
        distance:   +dist.toFixed(2),
        matchScore: Math.round(Math.min(score, 100)),
        skillMatch: exactMatch ? 'exact' : partialMatch ? 'partial' : 'none',
        needType,
      };
    })
    .filter(v => v.matchScore > 10)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.distance - b.distance;
    });
}


// ══════════════════════════════════════════════════════════════
// 🗺️ HEAT MAP DATA GENERATOR
// Aggregates needs into geographic clusters for heat map overlay
// ══════════════════════════════════════════════════════════════
export function generateHeatMapData(needs) {
  if (!needs || needs.length === 0) return [];

  return needs
    .filter(n => n.lat && n.lng && n.status !== 'Completed')
    .map(n => {
      const priority = calculatePriorityScore(n);
      // Weight = priority-normalized intensity for heat map
      const weight = Math.min(priority / 100, 1.0);
      return {
        lat:      n.lat,
        lng:      n.lng,
        weight,
        priority,
        type:     normalizeType(n.type),
        urgency:  n.urgency,
        title:    n.title,
        id:       n.id,
      };
    });
}


// ══════════════════════════════════════════════════════════════
// 📊 DATA AGGREGATION ENGINE
// Structures fragmented need data into unified analytics
// ══════════════════════════════════════════════════════════════
export function aggregateNeedsData(needs, users) {
  const volunteers = users.filter(u =>
    (u.role === 'Volunteer' || u.role === 'volunteer')
  );

  // By type
  const byType = needs.reduce((acc, n) => {
    const type = normalizeType(n.type);
    if (!acc[type]) acc[type] = { count: 0, pending: 0, critical: 0, totalQty: 0 };
    acc[type].count++;
    if (n.status === 'Pending')      acc[type].pending++;
    if (n.urgency === 'Critical')    acc[type].critical++;
    acc[type].totalQty += (n.qty || 1);
    return acc;
  }, {});

  // By location cluster (group nearby coords)
  const locationClusters = clusterByLocation(needs.filter(n => n.lat && n.lng));

  // Volunteer coverage gaps (types with needs but no matching volunteers)
  const coverageGaps = Object.keys(byType).filter(type => {
    const requiredSkills = (skillMap[type] || []).map(s => s.toLowerCase());
    const hasVolunteer   = volunteers.some(v => {
      const vSkill = (v.skill || '').toLowerCase();
      return requiredSkills.includes(vSkill);
    });
    return !hasVolunteer && byType[type].pending > 0;
  });

  // Trend: needs in last 24h vs previous 24h
  const now = Date.now();
  const last24h = needs.filter(n => {
    const ts = n.createdAt?.toDate?.() || new Date(n.createdAt);
    return (now - ts.getTime()) < 86400000;
  }).length;
  const prev24h = needs.filter(n => {
    const ts = n.createdAt?.toDate?.() || new Date(n.createdAt);
    const age = now - ts.getTime();
    return age >= 86400000 && age < 172800000;
  }).length;

  // Critical unassigned count
  const criticalUnassigned = needs.filter(
    n => (n.urgency === 'Critical' || n.urgency === 'High') && n.status === 'Pending'
  ).length;

  // Completion rate
  const completionRate = needs.length
    ? Math.round((needs.filter(n => n.status === 'Completed').length / needs.length) * 100)
    : 0;

  // Area severity scores
  const areaSeverity = locationClusters.map(cluster => ({
    ...cluster,
    severityScore: cluster.needs.reduce((s, n) => s + calculatePriorityScore(n), 0),
    dominantType:  getMostFrequent(cluster.needs.map(n => normalizeType(n.type))),
  })).sort((a, b) => b.severityScore - a.severityScore);

  return {
    byType,
    locationClusters,
    areaSeverity,
    coverageGaps,
    trend:             { last24h, prev24h, change: last24h - prev24h },
    criticalUnassigned,
    completionRate,
    totalVolunteers:   volunteers.length,
    availableVolunteers: volunteers.filter(v => v.available !== false).length,
  };
}


// ══════════════════════════════════════════════════════════════
// 📍 LOCATION CLUSTERING — group nearby needs (radius ~2km)
// ══════════════════════════════════════════════════════════════
function clusterByLocation(needs, radiusKm = 2) {
  const clusters = [];
  const assigned = new Set();

  needs.forEach((need, i) => {
    if (assigned.has(i)) return;
    const cluster = { center: { lat: need.lat, lng: need.lng }, needs: [need] };
    assigned.add(i);

    needs.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;
      const dist = getDistanceKm(need.lat, need.lng, other.lat, other.lng);
      if (dist <= radiusKm) {
        cluster.needs.push(other);
        assigned.add(j);
      }
    });

    // Recalculate centroid
    const avgLat = cluster.needs.reduce((s, n) => s + n.lat, 0) / cluster.needs.length;
    const avgLng = cluster.needs.reduce((s, n) => s + n.lng, 0) / cluster.needs.length;
    cluster.center = { lat: avgLat, lng: avgLng };

    clusters.push(cluster);
  });

  return clusters;
}

function getMostFrequent(arr) {
  if (!arr.length) return 'Other';
  const freq = arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}


// ══════════════════════════════════════════════════════════════
// 🔤 NLP ENGINE
// ══════════════════════════════════════════════════════════════
const cleanText = (text = "") => text.toLowerCase().replace(/[^\w\s]/g, '');

const CATEGORY_KEYWORDS = {
  Food:          ['food', 'meal', 'rice', 'hungry', 'eat', 'nutrition', 'feeding'],
  Water:         ['water', 'drink', 'thirst', 'flood', 'clean water'],
  Medical:       ['doctor', 'medical', 'injury', 'hospital', 'medicine', 'sick', 'health', 'wounded'],
  Shelter:       ['shelter', 'home', 'house', 'roof', 'displaced', 'housing'],
  Clothing:      ['clothes', 'clothing', 'apparel', 'wear'],
  Transport:     ['transport', 'vehicle', 'ambulance', 'drive'],
  Utilities:     ['electricity', 'power', 'internet', 'utility'],
  Education:     ['teach', 'education', 'school', 'train'],
  Legal:         ['legal', 'law', 'case', 'document'],
  Technical:     ['tech', 'computer', 'system', 'it support'],
  Communication: ['social', 'media', 'translate', 'communicate'],
  Support:       ['counsel', 'care', 'support', 'mental'],
  Operations:    ['event', 'fund', 'management', 'logistics'],
  Remote:        ['online', 'remote', 'virtual'],
};

const URGENCY_KEYWORDS = {
  Critical: ['critical', 'emergency', 'dying', 'life', 'death', 'immediate', 'now'],
  High:     ['urgent', 'asap', 'serious', 'quickly', 'bleeding'],
  Medium:   ['need', 'help', 'require', 'request'],
  Low:      ['later', 'whenever', 'no rush', 'low priority'],
};

function matchCategory(text) {
  let best = 'Other', max = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = words.filter(w => text.includes(w)).length * 2;
    if (score > max) { max = score; best = cat; }
  }
  return best;
}

function matchUrgency(text) {
  for (const [level, words] of Object.entries(URGENCY_KEYWORDS)) {
    if (words.some(w => text.includes(w))) return level;
  }
  return 'Medium';
}

function extractQuantity(text) {
  const match = text.match(/\b(\d+)\b/);
  return match ? parseInt(match[0]) : null;
}

export function nlpClassify(text) {
  const t = cleanText(text);
  return {
    category: matchCategory(t),
    urgency:  matchUrgency(t),
    qty:      extractQuantity(t),
  };
}

export function detectUrgencyScore(text) {
  const t = cleanText(text);
  if (/critical|emergency|dying|life/.test(t)) return 95;
  if (/urgent|asap|serious|bleeding/.test(t))  return 80;
  if (/help|need|require/.test(t))              return 60;
  return 30;
}


// ══════════════════════════════════════════════════════════════
// 🧠 AUTO RESOURCE ALLOCATION — optimized assignments
// ══════════════════════════════════════════════════════════════
export function optimizeAssignments(needs, users) {
  const sortedNeeds = [...needs]
    .map(n => ({ ...n, priorityScore: calculatePriorityScore(n) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const assignedVolunteers = new Set();
  const assignments = [];

  sortedNeeds.forEach(need => {
    const matches = aiMatchVolunteers(need, users)
      .filter(v => !assignedVolunteers.has(v.uid || v.id));

    if (matches.length > 0) {
      const best = matches[0];
      assignedVolunteers.add(best.uid || best.id);
      assignments.push({
        needId:    need.id,
        volunteer: best,
        priority:  need.priorityScore,
        confidence: best.matchScore,
      });
    }
  });

  return assignments;
}


// ══════════════════════════════════════════════════════════════
// 📈 PREDICTIVE ANALYTICS — forecast high-risk areas
// ══════════════════════════════════════════════════════════════
export function predictHighRiskAreas(needs, historicalData = []) {
  const allNeeds = [...needs, ...historicalData];
  const clusters = clusterByLocation(allNeeds.filter(n => n.lat && n.lng));

  return clusters
    .map(cluster => {
      const score  = cluster.needs.reduce((s, n) => s + calculatePriorityScore(n), 0);
      const types  = [...new Set(cluster.needs.map(n => normalizeType(n.type)))];
      const avgUrgency = cluster.needs.filter(n => n.urgency === 'Critical' || n.urgency === 'High').length;

      return {
        center:      cluster.center,
        riskScore:   Math.round(score / cluster.needs.length),
        totalNeeds:  cluster.needs.length,
        needTypes:   types,
        criticalCount: avgUrgency,
        riskLevel:   score > 200 ? 'High' : score > 100 ? 'Medium' : 'Low',
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
}