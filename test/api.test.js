import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../server.js";

async function withServer(app, run) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("GET /api/health reports reachable ollama", async () => {
  const app = createApp({
    ollamaClient: { ping: async () => true, generate: async () => ({ response: "" }) },
    marketClient: { getPrice: async () => ({ price: "1", symbol: "BTCUSDT" }), getKlines: async () => ({ klines: [], symbol: "BTCUSDT" }) },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, { ok: true, ollama: "reachable" });
  });
});

test("GET /api/docs.json returns OpenAPI schema", async () => {
  const app = createApp({
    ollamaClient: { ping: async () => true, generate: async () => ({ response: "" }) },
    marketClient: { getPrice: async () => ({ price: "1", symbol: "BTCUSDT" }), getKlines: async () => ({ klines: [], symbol: "BTCUSDT" }) },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/docs.json`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.openapi, "3.0.3");
    assert.equal(body.info?.title, "AI Bitcoin Trading Backend API");
  });
});

test("GET /api/market/price maps upstream error to 502", async () => {
  const app = createApp({
    ollamaClient: { ping: async () => false, generate: async () => ({ error: "offline" }) },
    marketClient: { getPrice: async () => ({ error: "upstream failed" }), getKlines: async () => ({ klines: [], symbol: "BTCUSDT" }) },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/market/price`);
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error, "upstream failed");
  });
});

test("POST /api/ask validates request body", async () => {
  const app = createApp({
    ollamaClient: { ping: async () => true, generate: async () => ({ response: "unused" }) },
    marketClient: { getPrice: async () => ({ price: "1", symbol: "BTCUSDT" }), getKlines: async () => ({ klines: [], symbol: "BTCUSDT" }) },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /Missing or invalid/);
  });
});

test("POST /api/ask returns generated answer", async () => {
  let capturedPrompt = "";
  const app = createApp({
    ollamaClient: {
      ping: async () => true,
      generate: async (prompt) => {
        capturedPrompt = prompt;
        return { response: "Model answer" };
      },
    },
    marketClient: {
      getPrice: async () => ({ price: "50000", symbol: "BTCUSDT" }),
      getKlines: async () => ({ klines: [], symbol: "BTCUSDT" }),
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Should I buy now?" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.answer, "Model answer");
    assert.match(capturedPrompt, /Current BTCUSDT price: 50000/);
  });
});
