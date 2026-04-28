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
    if (!message) return "Please enter a message.";

    console.log("📩 Message:", message);
    console.log("🔑 API KEY:", process.env.GEMINI_API_KEY);

    // ✅ cache check
    if (cache.has(message)) {
      console.log("⚡ Cache hit");
      return cache.get(message);
    }

    const prompt = `
You are SmartAid AI.

User: "${message}"

Reply in 1-2 short helpful sentences.
`;

    // ✅ CORRECT Gemini API (HEADER AUTH)
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    // ❗ Handle HTTP errors properly
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Gemini HTTP Error:", text);
      return fallbackReply(message);
    }

    const data = await res.json();

    console.log("🧠 Gemini FULL response:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("❌ No reply from Gemini");
      return fallbackReply(message);
    }

    // ✅ cache result
    cache.set(message, reply);

    return reply;

  } catch (err) {
    console.error("❌ AI Chat Error:", err);
    return fallbackReply(message);
  }
}

// ================= FALLBACK CHAT =================
function fallbackReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes("doctor")) {
    return "You can check the Live Map to find nearby doctors.";
  }

  if (msg.includes("ngo")) {
    return "Welcome! How can I support your NGO today?";
  }

  if (msg.includes("volunteer")) {
    return "You can view available volunteers in the Volunteers section.";
  }

  if (msg.includes("help")) {
    return "I can help you post needs, find volunteers, or assist NGOs.";
  }

  return "I didn’t understand. Try asking something else.";
}

// ================= PARSER =================
export async function parseWithGemini(text) {
  try {
    console.log("INPUT:", text);

    // 🔥 Using fallback parser (fast & reliable)
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

    const regex = new RegExp(`(\\d+)?\\s*${pattern}s?`, "gi");

    let match;

    while ((match = regex.exec(lowerText)) !== null) {
      const qty = parseInt(match[1] || 1);

      needs.push({
        title: `Need ${qty} ${skill}${qty > 1 ? "s" : ""}`,
        type: skill,
        role: skill,
        qty,
        urgency,
        location,
        requiredVolunteers: qty,
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