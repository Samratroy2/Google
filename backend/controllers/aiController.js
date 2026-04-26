import { parseWithGemini } from "../services/aiService.js";

export const parseNeed = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 3) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const result = await parseWithGemini(text);

    res.json(result);

  } catch (err) {
    console.error("❌ Controller Error:", err.message);
    res.status(500).json({ error: "AI parsing failed" });
  }
};