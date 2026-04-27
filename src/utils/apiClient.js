const API_BASE = process.env.REACT_APP_API_URL;
export async function parseNeed(text) {
  const res = await fetch(`${API_BASE}/api/ai/parse-need`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("API ERROR:", t);
    throw new Error("API failed");
  }

  return res.json(); // array
}