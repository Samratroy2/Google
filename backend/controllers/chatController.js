import { askAI } from "../services/aiService.js";

export const handleChat = async (req, res) => {
  try {
    const { message, needs, users } = req.body;

    const reply = await askAI(message, needs, users);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
};