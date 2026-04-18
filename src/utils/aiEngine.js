// ── AI Engine ───────────────────────────────────────────────────────────────

// Skill → Need category mapping
const SKILL_NEED_MAP = {
  Medical:  ['Doctor', 'Counselor'],
  Food:     ['Helper', 'Driver', 'Logistics'],
  Shelter:  ['Helper', 'Logistics'],
  Water:    ['Driver', 'Logistics'],
  Other:    ['Helper'],
};

// 🔥 Normalize category (VERY IMPORTANT)
const normalizeCategory = (cat) => {
  if (!cat) return 'Other';

  const c = cat.toLowerCase();

  if (c.includes('doctor') || c.includes('medical') || c.includes('hospital') || c.includes('injur'))
    return 'Medical';

  if (c.includes('food') || c.includes('meal') || c.includes('packet') || c.includes('rice') || c.includes('ration'))
    return 'Food';

  if (c.includes('water') || c.includes('drink') || c.includes('hydr'))
    return 'Water';

  if (c.includes('shelter') || c.includes('tent') || c.includes('camp') || c.includes('home'))
    return 'Shelter';

  return 'Other';
};

// ✅ Unified getter (fixes category/type mismatch)
const getNeedType = (need) => normalizeCategory(need.category || need.type);

// ───────────────────────────────────────────────────────────────────────────
// 🤖 AI MATCHING ENGINE (MAIN LOGIC)
// ───────────────────────────────────────────────────────────────────────────

export function aiMatchVolunteers(need, volunteers) {
  const needType = getNeedType(need);
  const relevantSkills = SKILL_NEED_MAP[needType] || ['Helper'];

  return volunteers
    .filter(v => v.available)
    .map(v => {
      let score = 0;

      // ✅ 1. SKILL MATCH (75%)
      if (relevantSkills.includes(v.skill)) {
        score += 0.75;
      } else {
        score += 0.30; // fallback (important fix)
      }

      // ✅ 2. DISTANCE (20%)
      const dist = v.distance || 5;

      let distScore = 0;
      if (dist <= 1) distScore = 1;
      else if (dist <= 3) distScore = 0.8;
      else if (dist <= 5) distScore = 0.6;
      else if (dist <= 8) distScore = 0.4;
      else distScore = 0.2;

      score += distScore * 0.20;

      // ✅ 3. EXPERIENCE (5%)
      const expScore = Math.min(1, (v.tasksCompleted || 0) / 20);
      score += expScore * 0.05;

      // ✅ BONUS: perfect match boost
      if (relevantSkills.includes(v.skill) && dist < 3) {
        score += 0.05;
      }

      // ✅ FINAL CLAMP
      score = Math.min(0.99, score);

      return {
        ...v,
        matchScore: parseFloat(score.toFixed(2))
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ───────────────────────────────────────────────────────────────────────────
// 🧠 NLP CLASSIFIER (SMART INPUT PARSER)
// ───────────────────────────────────────────────────────────────────────────

export function nlpClassify(text) {
  const t = text.toLowerCase();

  let category = 'Other';

  if (/(food|meal|eat|hunger|packet|rice|ration)/i.test(t)) category = 'Food';
  else if (/(water|drink|hydration)/i.test(t)) category = 'Water';
  else if (/(doctor|medical|hospital|medicine|injur|health|nurse)/i.test(t)) category = 'Medical';
  else if (/(shelter|home|tent|camp|roof)/i.test(t)) category = 'Shelter';

  let urgency = 'Medium';

  if (/(critical|emergency|asap|immediately|life|death)/i.test(t)) urgency = 'Critical';
  else if (/(urgent|need|help|soon|quick)/i.test(t)) urgency = 'High';
  else if (/(low|whenever|later)/i.test(t)) urgency = 'Low';

  // quantity extraction
  const qtyMatch = t.match(/(\d+)/);
  const qty = qtyMatch ? parseInt(qtyMatch[1]) : null;

  return { category, urgency, qty };
}

// ───────────────────────────────────────────────────────────────────────────
// ⚡ URGENCY SCORE (0–100)
// ───────────────────────────────────────────────────────────────────────────

export function detectUrgencyScore(text) {
  if (!text) return 30;

  const t = text.toLowerCase();

  if (/(critical|emergency|life|death)/i.test(t)) return 95;
  if (/(urgent|asap|immediately)/i.test(t)) return 80;
  if (/(need|help|require)/i.test(t)) return 60;
  if (/(low|later|whenever)/i.test(t)) return 20;

  return 30;
}

// ───────────────────────────────────────────────────────────────────────────
// 🎯 TASK RECOMMENDATION ENGINE
// ───────────────────────────────────────────────────────────────────────────

export function recommendTasksForVolunteer(volunteer, needs) {
  const skillMap = {
    Doctor: ['Medical'],
    Driver: ['Food', 'Water'], // ✅ FIXED (multiple categories)
    Helper: ['Shelter', 'Food'],
    Logistics: ['Food', 'Water'],
    Counselor: ['Medical'],
    Other: ['Other'],
  };

  return needs
    .filter(n => n.status === 'Pending')
    .map(need => {
      let score = 0;

      const needType = getNeedType(need);
      const allowed = skillMap[volunteer.skill] || ['Other'];

      // Skill match
      if (allowed.includes(needType)) score += 0.6;

      // Urgency boost
      const urgencyWeight = {
        Critical: 0.3,
        High: 0.2,
        Medium: 0.1,
        Low: 0.05
      };

      score += urgencyWeight[need.urgency] || 0.05;

      // slight randomness
      score += Math.random() * 0.1;

      return {
        ...need,
        recommendScore: parseFloat(score.toFixed(2))
      };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, 3);
}

// ───────────────────────────────────────────────────────────────────────────
// 📊 DEMAND PREDICTION
// ───────────────────────────────────────────────────────────────────────────

export function predictDemand(area, historicalNeeds) {
  const areaNeeds = historicalNeeds.filter(n =>
    (n.location || '').toLowerCase().includes(area.toLowerCase())
  );

  const categories = areaNeeds.reduce((acc, n) => {
    const type = getNeedType(n);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  const probability = Math.min(95, 50 + areaNeeds.length * 5);

  return {
    area,
    topNeed: topCategory ? topCategory[0] : 'Unknown',
    probability,
    timeframe:
      probability > 80 ? 'Tomorrow' :
      probability > 60 ? 'In 2 days' :
      'This week'
  };
}