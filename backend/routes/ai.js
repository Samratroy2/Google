import express from "express";
import { parseNeed } from "../controllers/aiController.js";

const router = express.Router();

router.post("/parse-need", parseNeed);

export default router;