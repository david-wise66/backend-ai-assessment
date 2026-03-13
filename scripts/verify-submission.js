import { createApp } from "../server.js";

async function main() {
  const app = createApp();
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, () => resolve(s));
    s.on("error", reject);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await assertHealth(baseUrl);
    await assertPrice(baseUrl);
    await assertKlines(baseUrl);
    await assertAsk(baseUrl);
    console.log("Submission verification passed.");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
}

async function assertHealth(baseUrl) {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  if (!response.ok || body.ok !== true) {
    throw new Error(`Health check failed: ${JSON.stringify(body)}`);
  }
}

async function assertPrice(baseUrl) {
  const response = await fetch(`${baseUrl}/api/market/price?symbol=BTCUSDT`);
  const body = await response.json();
  if (!response.ok || !body.price || body.symbol !== "BTCUSDT") {
    throw new Error(`Price check failed: ${JSON.stringify(body)}`);
  }
}

async function assertKlines(baseUrl) {
  const response = await fetch(
    `${baseUrl}/api/market/klines?symbol=BTCUSDT&interval=1h&limit=3`
  );
  const body = await response.json();
  if (!response.ok || !Array.isArray(body.klines) || body.klines.length === 0) {
    throw new Error(`Klines check failed: ${JSON.stringify(body)}`);
  }
}

async function assertAsk(baseUrl) {
  const response = await fetch(`${baseUrl}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "One sentence BTC risk note for now.",
    }),
  });
  const body = await response.json();
  if (!response.ok || typeof body.answer !== "string" || body.answer.length === 0) {
    throw new Error(`Ask check failed: ${JSON.stringify(body)}`);
  }
}

main().catch((err) => {
  console.error(`Submission verification failed: ${err.message}`);
  process.exit(1);
});
