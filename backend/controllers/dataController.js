// backend/controllers/dataController.js

import { sendCompletionEmail } from "../services/emailService.js";

export const completeNeed = async (req, res) => {
  try {
    const { need } = req.body;

    console.log("✅ Complete Need:", need?.title);

    if (!need || !need.postedBy?.email) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // 📧 SEND EMAIL
    await sendCompletionEmail(need.postedBy.email, need);

    return res.json({
      success: true,
      message: "Completed + Email sent"
    });

  } catch (err) {
    console.error("❌ completeNeed error:", err);
    res.status(500).json({ error: "Failed" });
  }
};