// ── AI Engine ─────────────────────────────────────────────────────────────────
// Smart matching, NLP classification, urgency detection

// Skill → Need type mapping
const SKILL_NEED_MAP = {
  Medical:  ['Doctor', 'Counselor'],
  Food:     ['Helper', 'Driver', 'Logistics'],
  Shelter:  ['Helper', 'Logistics'],
  Water:    ['Driver', 'Logistics'],
  Other:    ['Helper'],
};

/**
 * AI Matching Engine
 * Scores each volunteer for a given need (0–1 scale).
 * Factors: skill match, distance, urgency, past performance.
 */
export function aiMatchVolunteers(need, volunteers) {
  const relevantSkills = SKILL_NEED_MAP[need.type] || ['Helper'];
  const urgencyWeight  = { Critical: 0.25, High: 0.20, Medium: 0.15, Low: 0.10 };

  return volunteers
    .filter(v => v.available)
    .map(v => {
      let score = 0;

      // Skill match (40%)
      if (relevantSkills.includes(v.skill)) score += 0.40;
      else score += 0.10;

      // Distance score (30%) — closer = higher
      const distScore = Math.max(0, 1 - v.distance / 10);
      score += distScore * 0.30;

      // Urgency bonus (25%)
      score += urgencyWeight[need.urgency] || 0.10;

      // Experience bonus (5%)
      score += Math.min(0.05, v.tasksCompleted * 0.002);

      // Add slight randomisation for demo realism
      score = Math.min(0.99, score + (Math.random() * 0.04 - 0.02));

      return { ...v, matchScore: parseFloat(score.toFixed(2)) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * NLP Need Classifier
 * Extracts category and urgency from free-text input.
 */
export function nlpClassify(text) {
  const t = text.toLowerCase();

  // Category detection
  let category = 'Other';
  if (/food|meal|eat|hunger|packet|rice|grain|provision/.test(t))           category = 'Food';
  else if (/water|drink|fluid|hydrat/.test(t))                              category = 'Water';
  else if (/doctor|medical|medicine|hospital|sick|hurt|injur|health|nurse/.test(t)) category = 'Medical';
  else if (/shelter|home|house|sleep|accommodation|roof|tent|camp/.test(t)) category = 'Shelter';

  // Urgency detection
  let urgency = 'Medium';
  if (/urgent|emergency|critical|immediately|asap|dying|starv|life|death/.test(t)) urgency = 'Critical';
  else if (/need|require|help|soon|quickly|fast/.test(t))                          urgency = 'High';
  else if (/sometime|maybe|whenever|eventually|low/.test(t))                       urgency = 'Low';

  // Quantity extraction
  const qtyMatch = t.match(/(\d+)\s*(people|person|families|packets|kits|litres|doctors?|volunteers?)/);
  const qty      = qtyMatch ? parseInt(qtyMatch[1]) : null;

  return { category, urgency, qty };
}

/**
 * Urgency Detector — returns numeric score 0–100
 */
export function detectUrgencyScore(text) {
  const t = text.toLowerCase();
  let score = 30;
  if (/critical|emergency|dying|life|death/.test(t)) score = 95;
  else if (/urgent|immediately|asap|starv/.test(t))  score = 80;
  else if (/help|need|require|fast/.test(t))          score = 60;
  else if (/sometime|maybe|low/.test(t))              score = 20;
  return score;
}

/**
 * Smart Recommendation — suggests best-fit tasks for a volunteer
 */
export function recommendTasksForVolunteer(volunteer, needs) {
  const relevantNeeds = needs.filter(n => n.status === 'Pending');
  const skillMap = {
    Doctor:    'Medical',
    Driver:    'Food',
    Helper:    'Shelter',
    Logistics: 'Food',
    Counselor: 'Medical',
    Other:     'Other',
  };

  return relevantNeeds
    .map(need => {
      let score = 0;
      if (skillMap[volunteer.skill] === need.type) score += 0.5;
      const urgencyWeight = { Critical: 0.3, High: 0.2, Medium: 0.1, Low: 0.05 };
      score += urgencyWeight[need.urgency] || 0.05;
      score += Math.random() * 0.15;
      return { ...need, recommendScore: parseFloat(score.toFixed(2)) };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, 3);
}

/**
 * Demand Predictor — generates prediction for an area based on pattern
 */
export function predictDemand(area, historicalNeeds) {
  const areaNeeds  = historicalNeeds.filter(n => n.location.includes(area));
  const categories = areaNeeds.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const probability = Math.min(95, 50 + (areaNeeds.length * 5) + Math.floor(Math.random() * 20));
  return {
    area,
    topNeed:     topCategory ? topCategory[0] : 'Unknown',
    probability,
    timeframe:   probability > 80 ? 'Tomorrow' : probability > 60 ? 'In 2 days' : 'This week',
  };
}
