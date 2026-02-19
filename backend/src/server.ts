import dotenv from "dotenv";
dotenv.config(); // ⭐ MUST BE FIRST

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);

app.get("/", (_, res) => {
  res.send("Sentience Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
