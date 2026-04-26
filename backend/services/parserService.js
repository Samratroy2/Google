// backend/services/parserService.js

export async function parseNeedText(text) {
  const qtyMatch = text.match(/\d+/);
  const qty = qtyMatch ? parseInt(qtyMatch[0]) : 1;

  let type = "General";
  if (/food|meal/i.test(text)) type = "Food";
  if (/water/i.test(text)) type = "Water";
  if (/doctor|medical/i.test(text)) type = "Medical";
  if (/teacher|education/i.test(text)) type = "Education";

  let urgency = "Medium";
  if (/urgent|immediately|asap/i.test(text)) urgency = "High";
  if (/critical|emergency/i.test(text)) urgency = "Critical";

  const locationMatch =
    text.match(/in ([A-Za-z ]+)/i) ||
    text.match(/at ([A-Za-z ]+)/i);

  let location = locationMatch ? locationMatch[1].trim() : null;

  // ❗ filter bad locations
  if (!location || location.length < 4) {
    location = null;
  }

  return {
    title: text,
    type,
    qty,
    urgency,
    location,
    requiredVolunteers: Math.ceil(qty / 10),
    description: text,
    confidence: location ? 0.85 : 0.6
  };
}