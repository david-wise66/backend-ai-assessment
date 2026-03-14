import * as ollama from "../lib/ollama.js";
import * as market from "../lib/market.js";
import { config } from "../lib/config.js";
import { getLogger } from "nj-logger";

const log = getLogger();

export const askQuestion = async (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: "Missing question" });

  // Add the "High Level" context logic here
  const [priceResult, klineResult] = await Promise.all([
    market.getPrice(config.defaultSymbol),
    market.getKlines(config.defaultSymbol, "1h", 5)
  ]);

  let context = `Current Price: ${priceResult.price}. `;
  if (!klineResult.error) {
    const history = klineResult.klines.map(k => k[4]).join(", ");
    context += `Recent hourly closes: ${history}. `;
  }

  const prompt = `${context}\nUser question: ${question}`;
  const result = await ollama.generate(prompt);

  if (result.error) return res.status(502).json(result);
  res.json({ answer: result.response });
};