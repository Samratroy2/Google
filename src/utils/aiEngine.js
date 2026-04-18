// ── AI Engine ─────────────────────────────────────────────────────────────────

// Skill → Need category mapping
const SKILL_NEED_MAP = {
  Medical:  ['Doctor', 'Counselor'],
  Food:     ['Helper', 'Driver', 'Logistics'],
  Shelter:  ['Helper', 'Logistics'],
  Water:    ['Driver', 'Logistics'],
  Other:    ['Helper'],
};

// ✅ Normalize category (CRITICAL FIX)
const normalizeCategory = (cat) => {
  if (!cat) return 'Other';
  const c = cat.toLowerCase();

  if (c.includes('doctor') || c.includes('medical') || c.includes('hospital') || c.includes('injur')) return 'Medical';
  if (c.includes('food') || c.includes('meal') || c.includes('packet') || c.includes('rice') || c.includes('ration')) return 'Food';
  if (c.includes('water') || c.includes('drink') || c.includes('hydr')) return 'Water';
  if (c.includes('shelter') || c.includes('tent') || c.includes('camp') || c.includes('home')) return 'Shelter';

  return 'Other';
};

// ✅ unified getter
const getNeedType = (need) => normalizeCategory(need.category || need.type);

/**
 * AI Matching Engine
 */
export function aiMatchVolunteers(need, volunteers) {
  const needType = getNeedType(need);
  const relevantSkills = SKILL_NEED_MAP[needType] || ['Helper'];

  const urgencyWeight = {
    Critical: 0.25,
    High: 0.20,
    Medium: 0.15,
    Low: 0.10
  };

  return volunteers
    .filter(v => v.available)
    .map(v => {
      let score = 0;

      // Skill match (40%)
      if (relevantSkills.includes(v.skill)) score += 0.40;
      else score += 0.10;

      // Distance score (30%)
      const distScore = Math.max(0, 1 - (v.distance || 5) / 10);
      score += distScore * 0.30;

      // Urgency (25%)
      score += urgencyWeight[need.urgency] || 0.10;

      // Experience (5%)
      score += Math.min(0.05, (v.tasksCompleted || 0) * 0.002);

      // Slight randomness
      score = Math.min(0.99, score + (Math.random() * 0.04 - 0.02));

      return { ...v, matchScore: parseFloat(score.toFixed(2)) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * NLP Classifier (🔥 IMPROVED)
 */
export function nlpClassify(text) {
  const t = text.toLowerCase();

  let category = 'Other';

  // ✅ Stronger detection
  if (/(food|meal|eat|hunger|packet|packets|rice|grain|ration)/i.test(t)) {
    category = 'Food';
  }
  else if (/(water|drink|hydration|liquid)/i.test(t)) {
    category = 'Water';
  }
  else if (/(doctor|medical|medicine|hospital|injur|health|nurse)/i.test(t)) {
    category = 'Medical';
  }
  else if (/(shelter|home|house|tent|camp|roof)/i.test(t)) {
    category = 'Shelter';
  }

  let urgency = 'Medium';

  if (/(critical|emergency|asap|immediately|life|death)/i.test(t)) urgency = 'Critical';
  else if (/(urgent|need|help|soon|quick)/i.test(t)) urgency = 'High';
  else if (/(low|whenever|later|not urgent)/i.test(t)) urgency = 'Low';

  // ✅ Better quantity extraction
  const qtyMatch = t.match(/(\d+)/);
  const qty = qtyMatch ? parseInt(qtyMatch[1]) : null;

  return { category, urgency, qty };
}

/**
 * Recommendation Engine
 */
export function recommendTasksForVolunteer(volunteer, needs) {
  const skillMap = {
    Doctor: 'Medical',
    Driver: 'Food',
    Helper: 'Shelter',
    Logistics: 'Food',
    Counselor: 'Medical',
    Other: 'Other',
  };

  return needs
    .filter(n => n.status === 'Pending')
    .map(need => {
      let score = 0;
      const needType = getNeedType(need);

      if (skillMap[volunteer.skill] === needType) score += 0.5;

      const urgencyWeight = {
        Critical: 0.3,
        High: 0.2,
        Medium: 0.1,
        Low: 0.05
      };

      score += urgencyWeight[need.urgency] || 0.05;
      score += Math.random() * 0.15;

      return { ...need, recommendScore: parseFloat(score.toFixed(2)) };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, 3);
}

/**
 * Demand Prediction
 */
export function predictDemand(area, historicalNeeds) {
  const areaNeeds = historicalNeeds.filter(n => n.location.includes(area));

  const categories = areaNeeds.reduce((acc, n) => {
    const type = getNeedType(n);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  const probability = Math.min(95, 50 + (areaNeeds.length * 5));

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

/**
 * Urgency Score
 */
export function detectUrgencyScore(text) {
  if (!text) return 30;

  const t = text.toLowerCase();

  if (/(critical|emergency|life|death)/i.test(t)) return 95;
  if (/(urgent|asap|immediately)/i.test(t)) return 80;
  if (/(need|help|require)/i.test(t)) return 60;
  if (/(low|later|whenever)/i.test(t)) return 20;

  return 30;
}