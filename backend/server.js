import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ root route FIRST
app.get("/", (req, res) => {
  res.send("SmartAid Backend is running 🚀");
});

// ✅ mount routes
app.use("/api", apiRoutes);

// 🔥 IMPORTANT: use dynamic PORT
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});