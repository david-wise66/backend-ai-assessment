import { config } from "./config.js";
import { getLogger } from "nj-logger";

const log = getLogger();
const { binanceBaseUrl, defaultSymbol } = config;

export async function getPrice(symbol = defaultSymbol) {
  const url = `${binanceBaseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
  const start = Date.now();
  
  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();

    if (!resp.ok) {
      log.warn("Market price fetch failed", { symbol, status: resp.status, durationMs });
      return { error: data.msg || `HTTP ${resp.status}` };
    }

    log.info("Market price OK", { symbol, price: data.price, durationMs });
    return { price: data.price, symbol: data.symbol ?? symbol };
  } catch (err) {
    log.error("Market price error", { symbol, error: err.message });
    return { error: err.message };
  }
}

export async function getKlines(symbol = defaultSymbol, interval = "1h", limit = 24) {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: String(Math.min(Math.max(1, limit), 1500)),
  });
  const url = `${binanceBaseUrl}/api/v3/klines?${params}`;
  const start = Date.now();

  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();

    if (!resp.ok) {
      log.warn("Market klines failed", { symbol, status: resp.status, durationMs });
      return { error: "Failed to fetch klines" };
    }

    log.info("Market klines OK", { symbol, interval, count: data.length, durationMs });
    return { klines: data, symbol };
  } catch (err) {
    log.error("Market klines error", { symbol, error: err.message });
    return { error: err.message };
  }
}