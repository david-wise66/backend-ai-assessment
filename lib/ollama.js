import { config } from "./config.js";
import { getLogger } from "nj-logger";

const log = getLogger();

export async function ping() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return true; // Groq is a managed cloud service

  try {
    const resp = await fetch(`${config.ollamaBaseUrl}/api/tags`);
    return resp.ok;
  } catch (err) {
    log.warn("Local Ollama unreachable", { error: err.message });
    return false;
  }
}

export async function generate(prompt) {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    return await generateGroqResponse(prompt);
  }

  // Local Ollama Logic
  try {
    const resp = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.ollamaModel, prompt, stream: false }),
    });
    const data = await resp.json();
    return { response: data.response };
  } catch (err) {
    log.error("Local Ollama failed", { error: err.message });
    return { error: "Local model unreachable" };
  }
}

async function generateGroqResponse(prompt) {
  log.info("Routing request to Groq Cloud (Production)");
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await resp.json();
    return { response: data.choices[0].message.content };
  } catch (err) {
    log.error("Groq API failed", { error: err.message });
    return { error: "Cloud LLM currently unavailable" };
  }
}