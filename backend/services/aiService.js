// ================= SIMPLE CACHE =================
const cache = new Map();


// ================= CHAT AI =================
export async function askAI(message, needs = [], users = []) {
  try {
    // ⚡ CACHE (instant response if repeated)
    if (cache.has(message)) return cache.get(message);

    // ⚡ LIMIT DATA (speed boost)
    const trimmedNeeds = needs.slice(0, 5);
    const trimmedUsers = users.slice(0, 5);

    const prompt = `
You are SmartAid AI.

User: "${message}"

Needs: ${JSON.stringify(trimmedNeeds)}
Users: ${JSON.stringify(trimmedUsers)}

Reply in 1-2 short helpful sentences.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

    const data = await res.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

    cache.set(message, reply);

    return reply;

  } catch (err) {
    console.error("AI Chat Error:", err);
    return "⚠️ AI is currently unavailable.";
  }
}


// ================= PARSER =================
export async function parseWithGemini(text) {
  try {
    // ⚡ FAST PATH (regex first → no API call)
    if (/doctor|teacher|food|water/i.test(text)) {
      return fallbackParser(text);
    }

    const prompt = `
Extract structured needs from the text.

Return ONLY JSON ARRAY like:

[
  {
    "title": "Need 2 doctors",
    "type": "Medical",
    "qty": 2,
    "urgency": "High",
    "location": "Kolkata",
    "requiredVolunteers": 2,
    "description": "Need doctors urgently"
  }
]

Rules:
- doctor → Medical
- teacher → Education
- food → Food
- water → Water
- Extract quantity (default = 1)
- urgency:
   emergency → Critical
   urgent/immediately/asap → High
- Clean location
- requiredVolunteers:
   Medical/Education → qty
   Food → qty/30
   Water → qty/20
- Split multiple needs

Text:
"${text}"
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

    const data = await res.json();

    let output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // ✅ CLEAN RESPONSE
    output = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = output.indexOf("[");
    const end = output.lastIndexOf("]");

    output = output.slice(start, end + 1);

    return JSON.parse(output);

  } catch (err) {
    console.log("⚠️ Gemini failed → fallback");
    return fallbackParser(text);
  }
}


// ================= FALLBACK PARSER =================
function fallbackParser(text) {
  const needs = [];

  const urgency = getUrgency(text);
  const location = cleanLocation(extractLocation(text));

  // 👨‍⚕️ DOCTOR
  const doctorMatch = text.match(/(\d+)?\s*doctor/i);
  if (doctorMatch) {
    const qty = parseInt(doctorMatch[1] || 1);

    needs.push({
      title: `Need ${qty} doctor${qty > 1 ? "s" : ""}`,
      type: "Medical",
      qty,
      urgency,
      location,
      requiredVolunteers: qty,
      description: text
    });
  }

  // 👩‍🏫 TEACHER
  const teacherMatch = text.match(/(\d+)?\s*teacher/i);
  if (teacherMatch) {
    const qty = parseInt(teacherMatch[1] || 1);

    needs.push({
      title: `Need ${qty} teacher${qty > 1 ? "s" : ""}`,
      type: "Education",
      qty,
      urgency,
      location,
      requiredVolunteers: qty,
      description: text
    });
  }

  // 🍱 FOOD
  const foodMatch = text.match(/(\d+)?\s*(food|meal|packet)/i);
  if (foodMatch) {
    const qty = parseInt(foodMatch[1] || 10);

    needs.push({
      title: `Need food`,
      type: "Food",
      qty,
      urgency,
      location,
      requiredVolunteers: Math.ceil(qty / 30),
      description: text
    });
  }

  // 🚰 WATER
  const waterMatch = text.match(/(\d+)?\s*(water|bottle)/i);
  if (waterMatch) {
    const qty = parseInt(waterMatch[1] || 10);

    needs.push({
      title: `Need water`,
      type: "Water",
      qty,
      urgency,
      location,
      requiredVolunteers: Math.ceil(qty / 20),
      description: text
    });
  }

  // DEFAULT
  if (needs.length === 0) {
    needs.push({
      title: text,
      type: "General",
      qty: 1,
      urgency,
      location,
      requiredVolunteers: 1,
      description: text
    });
  }

  return needs;
}


// ================= HELPERS =================
function getUrgency(text) {
  if (/emergency/i.test(text)) return "Critical";
  if (/urgent|immediately|asap/i.test(text)) return "High";
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
    .replace(/urgent|urgently|immediately|asap/gi, "")
    .trim();
}