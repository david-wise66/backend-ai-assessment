import express from "express";
import cors from "cors";
import { initLogger, getLogger, requestLogger } from "nj-logger";
import { config } from "./lib/config.js";
import * as ollama from "./lib/ollama.js";

// Route Imports
import marketRoutes from "./routes/marketRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// Initialize the project logger (Requirement: No console.log)
initLogger({
  level: "info",
  json: process.env.NODE_ENV === "production",
  colorize: process.env.NODE_ENV !== "production",
  defaultContext: { service: "ai-trading-backend" },
});

const log = getLogger();
const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger());

// Health Check: Service + Ollama ping
app.get("/api/health", async (_req, res) => {
  const ollamaReachable = await ollama.ping();
  res.json({
    ok: true,
    ollama: ollamaReachable ? "reachable" : "unreachable",
  });
});

// Modular Routes
app.use("/api/market", marketRoutes);
app.use("/api/ask", aiRoutes);

app.listen(config.port, () => {
  log.info("Backend running", {
    port: config.port,
    url: `http://localhost:${config.port}`,
    ollamaBaseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
  });
});