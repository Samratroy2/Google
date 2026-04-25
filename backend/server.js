import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ ALL routes here
app.use("/api", apiRoutes);

app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});