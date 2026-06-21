import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import favorRoutes from "./routes/favorRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import requireAuth from "./middleware/requireAuth.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Favor API is running." });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api", requireAuth, favorRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "CastError") {
    return res.status(404).json({ message: "That item could not be found." });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors)[0].message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "That value is already in use." });
  }

  return res.status(500).json({ message: "Something went wrong on the server." });
});

export default app;
