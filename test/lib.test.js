import assert from "node:assert/strict";
import test from "node:test";
import { getKlines, getPrice } from "../lib/market.js";
import { generate, ping } from "../lib/ollama.js";

const originalFetch = global.fetch;

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("getPrice returns symbol and price on success", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ symbol: "BTCUSDT", price: "123.45" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const result = await getPrice("BTCUSDT");
  assert.deepEqual(result, { symbol: "BTCUSDT", price: "123.45" });
});

test("getPrice returns error when upstream fails", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ msg: "invalid symbol" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  const result = await getPrice("BADPAIR");
  assert.equal(result.error, "invalid symbol");
});

test("getKlines returns array payload", async () => {
  const klines = [[1, "1", "2", "0.5", "1.5", "10"]];
  global.fetch = async () =>
    new Response(JSON.stringify(klines), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const result = await getKlines("BTCUSDT", "1h", 1);
  assert.deepEqual(result, { symbol: "BTCUSDT", klines });
});

test("ping returns false when fetch errors", async () => {
  global.fetch = async () => {
    throw new Error("connection refused");
  };

  const result = await ping();
  assert.equal(result, false);
});

test("generate returns response on success", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ response: "answer text" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const result = await generate("question");
  assert.deepEqual(result, { response: "answer text" });
});

test("generate returns error on invalid JSON", async () => {
  global.fetch = async () =>
    new Response("not-json", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const result = await generate("question");
  assert.equal(result.error, "Invalid JSON from Ollama");
});
