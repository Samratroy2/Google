import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ================= MAIN FUNCTION =================
export async function parseWithGemini(text) {
  try {
    const prompt = `
Extract ALL needs from the text.

Return ONLY JSON ARRAY. No explanation.

Example:
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
- Split multiple needs (doctor, teacher etc.)
- qty applies per role
- urgency: emergency → Critical, urgent → High
- Clean location (no words like urgently)
- requiredVolunteers:
   Medical/Education → qty
   Water → qty/20
   Food → qty/30

Text:
"${text}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    let output = response.text;

    // CLEAN RESPONSE
    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    const start = output.indexOf("[");
    const end = output.lastIndexOf("]");

    const jsonString = output.slice(start, end + 1);

    return JSON.parse(jsonString);

  } catch (err) {
    console.log("⚠️ Gemini failed → using fallback");

    return fallbackParser(text);
  }
}

// ================= FALLBACK =================
function fallbackParser(text) {
  const needs = [];

  const urgency = getUrgency(text);
  const location = cleanLocation(extractLocation(text));

  // 👨‍⚕️ DOCTOR
  const doctorMatch = text.match(/(\d+)\s*doctor/i);
  if (doctorMatch) {
    const qty = parseInt(doctorMatch[1]);

    needs.push({
      title: "Need doctors",
      type: "Medical",
      qty,
      urgency,
      location,
      requiredVolunteers: getVolunteers("Medical", qty),
      description: text
    });
  }

  // 👩‍🏫 TEACHER
  const teacherMatch = text.match(/(\d+)\s*teacher/i);
  if (teacherMatch) {
    const qty = parseInt(teacherMatch[1]);

    needs.push({
      title: "Need teachers",
      type: "Education",
      qty,
      urgency,
      location,
      requiredVolunteers: getVolunteers("Education", qty),
      description: text
    });
  }

  // 🚰 WATER
  const waterMatch = text.match(/(\d+)\s*(water|bottle)/i);
  if (waterMatch) {
    const qty = parseInt(waterMatch[1]);

    needs.push({
      title: "Need water bottles",
      type: "Water",
      qty,
      urgency,
      location,
      requiredVolunteers: getVolunteers("Water", qty),
      description: text
    });
  }

  // 🍱 FOOD
  const foodMatch = text.match(/(\d+)\s*(food|meal|packet)/i);
  if (foodMatch) {
    const qty = parseInt(foodMatch[1]);

    needs.push({
      title: "Need food",
      type: "Food",
      qty,
      urgency,
      location,
      requiredVolunteers: getVolunteers("Food", qty),
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
function getVolunteers(type, qty) {
  switch (type) {
    case "Medical":
    case "Education":
      return qty;

    case "Water":
      return Math.ceil(qty / 20);

    case "Food":
      return Math.ceil(qty / 30);

    default:
      return Math.max(1, Math.ceil(qty / 10));
  }
}

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