
import express from "express";
import cors from "cors";
import systemRoutes from "./routes/systemRoutes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "System Viewer API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/system", systemRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((error, _req, res, _next) => {
  console.error("API error:", error);

  res.status(500).json({
    success: false,
    message: "Unable to collect system information"
  });
});

export default app;
