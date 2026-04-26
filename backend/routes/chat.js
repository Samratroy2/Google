import express from "express";
import { handleChat } from "../controllers/chatController.js";
import sendEmail from "../utils/email.js";

const router = express.Router();

// ✅ IMPORTANT: use "/" not "/chat"
router.post("/", handleChat);

// email route
router.post("/send-email", async (req, res) => {
  const { toEmail, needTitle } = req.body;

  try {
    await sendEmail(toEmail, needTitle);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;