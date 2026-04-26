import express from "express";
import { parseNeed } from "../controllers/aiController.js";

const router = express.Router();

// ✅ FINAL PATH → /api/ai/parse-need
router.post("/parse-need", parseNeed);

export default router;