// ================= ALL SKILLS =================
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

// ================= CACHE =================
const cache = new Map();

// ================= CHAT AI =================
export async function askAI(message) {
  try {
    if (cache.has(message)) return cache.get(message);

    const prompt = `
You are SmartAid AI.

User: "${message}"

Reply in 1-2 short helpful sentences.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    cache.set(message, reply);

    return reply;

  } catch (err) {
    console.error("AI Chat Error:", err);
    return "⚠️ AI unavailable";
  }
}

// ================= PARSER =================
export async function parseWithGemini(text) {
  try {
    console.log("INPUT:", text);

    // 🔥 ALWAYS USE FALLBACK (FAST + ACCURATE)
    return fallbackParser(text);

  } catch (err) {
    console.log("⚠️ Parser failed → fallback");
    return fallbackParser(text);
  }
}

// ================= FALLBACK PARSER =================
function fallbackParser(text) {
  const needs = [];

  const urgency = getUrgency(text);
  const location = cleanLocation(extractLocation(text));

  const lowerText = text.toLowerCase();

  const sortedSkills = [...ALL_SKILLS].sort((a, b) => b.length - a.length);

  for (let skill of sortedSkills) {

    const pattern = skill.replace(/\s+/g, "\\s+");

    // 🔥 supports: 2 drivers, driver, web developers
    const regex = new RegExp(`(\\d+)?\\s*${pattern}s?`, "gi");

    let match;

    while ((match = regex.exec(lowerText)) !== null) {
      const qty = parseInt(match[1] || 1);

      needs.push({
        title: `Need ${qty} ${skill}${qty > 1 ? "s" : ""}`,
        type: skill,              // ✅ exact role
        role: skill,              // ✅ critical for matching
        qty,
        urgency,
        location,
        requiredVolunteers: qty,  // ✅ direct mapping
        description: text
      });
    }
  }

  console.log("PARSED NEEDS:", needs);

  return needs;
}

// ================= HELPERS =================
function getUrgency(text) {
  if (/emergency/i.test(text)) return "Critical";
  if (/urgent|asap|immediately/i.test(text)) return "High";
  return "Medium";
}

function extractLocation(text) {
  const match =
    text.match(/in ([a-zA-Z ]+)/i) ||
    text.match(/at ([a-zA-Z ]+)/i);

  return match ? match[1].trim() : null;
}

function cleanLocation(loc) {
  if (!loc) return null;

  return loc
    .replace(/\b(urgent|urgently|immediately|asap)\b/gi, "")
    .trim();
}