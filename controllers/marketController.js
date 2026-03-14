import * as market from "../lib/market.js";
import { config } from "../lib/config.js";

export const getPrice = async (req, res) => {
  const symbol = req.query.symbol || config.defaultSymbol;
  const result = await market.getPrice(symbol);
  if (result.error) return res.status(502).json(result);
  res.json(result);
};

export const getKlines = async (req, res) => {
  const symbol = req.query.symbol || config.defaultSymbol;
  const interval = req.query.interval || "1h";
  const limit = Math.min(parseInt(req.query.limit, 10) || 24, 1500);
  const result = await market.getKlines(symbol, interval, limit);
  if (result.error) return res.status(502).json(result);
  res.json(result);
};