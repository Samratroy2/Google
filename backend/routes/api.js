import express from "express";
import { handleChat } from "../controllers/chatController.js";
import sendEmail from "../utils/email.js";

const router = express.Router();

// chat route
router.post("/chat", handleChat);

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

// test route
router.get("/", (req, res) => {
  res.send("API working");
});

export default router; // ✅ VERY IMPORTANT