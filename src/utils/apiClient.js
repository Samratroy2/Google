export async function parseNeed(text) {
  const res = await fetch("http://localhost:5000/api/ai/parse-need", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(t);
    throw new Error("API failed");
  }

  return res.json(); // array
}