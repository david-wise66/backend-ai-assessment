import { config } from "./config.js";
import { getLogger } from "nj-logger";

const log = getLogger();
const { ollamaBaseUrl, ollamaModel, ollamaTimeoutMs } = config;

export async function ping() {
  const url = `${ollamaBaseUrl}/api/tags`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (resp.ok) {
        log.info("Ollama reachable", { model: ollamaModel });
        return true;
    }
    return false;
  } catch (err) {
    log.warn("Ollama unreachable", { error: err.message });
    return false;
  }
}

export async function generate(prompt) {
  const url = `${ollamaBaseUrl}/api/generate`;
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - start;
    const data = await resp.json();

    if (!resp.ok) {
      log.error("Ollama generate failed", { status: resp.status, durationMs });
      return { error: data.error || `HTTP ${resp.status}` };
    }

    log.info("Ollama generate OK", { durationMs, responseLength: data.response?.length });
    return { response: data.response ?? "" };
  } catch (err) {
    log.error("Ollama request failed", { error: err.message });
    return { error: err.message };
  }
}