// backend/routes/api.js

import express from "express";
import chatRoutes from "./chat.js";
import aiRoutes from "./ai.js";
import { completeNeed } from "../controllers/dataController.js";

const router = express.Router(); // ✅ FIRST

// ✅ Chat routes
router.use("/chat", chatRoutes);

// ✅ AI routes
router.use("/ai", aiRoutes);

// ✅ COMPLETE NEED API (FIXED)
router.post("/complete-need", completeNeed);

// test route
router.get("/", (req, res) => {
  res.send("API working ✅");
});

export default router;