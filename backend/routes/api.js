import express from "express";
import chatRoutes from "./chat.js";
import aiRoutes from "./ai.js";

const router = express.Router();

// ✅ Chat routes → /api/chat
router.use("/chat", chatRoutes);

// ✅ AI routes → /api/ai
router.use("/ai", aiRoutes);

// test route
router.get("/", (req, res) => {
  res.send("API working ✅");
});

export default router;