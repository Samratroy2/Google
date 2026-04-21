import express from "express";
import { handleChat } from "../controllers/chatController.js";
import sendEmail from "../utils/email.js";

const router = express.Router();

router.post("/chat", handleChat);

router.post("/send-email", async (req, res) => {
  const { toEmail, needTitle } = req.body;

  try {
    await sendEmail(toEmail, needTitle);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ FULL ERROR:", err); // 👈 important
    res.status(500).json({ error: err.message }); // 👈 return real message
  }
});

export default router;