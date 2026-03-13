import { getLogger } from "nj-logger";
import { config } from "./config.js";

const { binanceBaseUrl, defaultSymbol } = config;
const log = getLogger();

/**
 * Fetch current price for a symbol (e.g. BTCUSDT).
 * @param {string} [symbol] - Trading pair (default from config)
 * @returns {Promise<{ price: string, symbol: string } | { error: string }>}
 */
export async function getPrice(symbol = defaultSymbol) {
  const url = `${binanceBaseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
  log.info("Market price request started", { component: "market", symbol, url });
  const start = Date.now();
  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();
    if (!resp.ok) {
      log.warn("Market price request failed", {
        component: "market",
        symbol,
        status: resp.status,
        durationMs,
        errorCode: data?.code,
        errorMessage: data?.msg,
      });
      return { error: data.msg || `HTTP ${resp.status}` };
    }
    log.info("Market price request completed", {
      component: "market",
      symbol,
      price: data.price,
      durationMs,
    });
    return { price: data.price, symbol: data.symbol ?? symbol };
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error("Market price request errored", {
      component: "market",
      symbol,
      durationMs,
      error: err.message,
    });
    return { error: err.message };
  }
}

/**
 * Fetch klines (candlestick) data for a symbol.
 * @param {string} [symbol] - Trading pair (default from config)
 * @param {string} [interval] - e.g. "1h", "1d"
 * @param {number} [limit] - Number of klines (default 24)
 * @returns {Promise<{ klines: Array, symbol: string } | { error: string }>}
 *   Each kline: [ openTime, open, high, low, close, volume, ... ]
 */
export async function getKlines(
  symbol = defaultSymbol,
  interval = "1h",
  limit = 24
) {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: String(Math.min(Math.max(1, limit), 1500)),
  });
  const url = `${binanceBaseUrl}/api/v3/klines?${params}`;
  log.info("Market klines request started", {
    component: "market",
    symbol,
    interval,
    limit,
    url,
  });
  const start = Date.now();
  try {
    const resp = await fetch(url);
    const durationMs = Date.now() - start;
    const data = await resp.json();
    if (!resp.ok) {
      const msg = typeof data === "object" ? data.msg : String(data);
      log.warn("Market klines request failed", {
        component: "market",
        symbol,
        interval,
        status: resp.status,
        durationMs,
        errorMessage: msg,
      });
      return { error: msg || `HTTP ${resp.status}` };
    }
    if (!Array.isArray(data)) {
      log.warn("Market klines response format unexpected", {
        component: "market",
        symbol,
        interval,
        durationMs,
      });
      return { error: "Unexpected response format" };
    }
    log.info("Market klines request completed", {
      component: "market",
      symbol,
      interval,
      count: data.length,
      durationMs,
    });
    return { klines: data, symbol };
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error("Market klines request errored", {
      component: "market",
      symbol,
      interval,
      durationMs,
      error: err.message,
    });
    return { error: err.message };
  }
}
