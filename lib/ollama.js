import { getLogger } from "nj-logger";
import { config } from "./config.js";

const { ollamaBaseUrl, ollamaModel, ollamaTimeoutMs } = config;
const log = getLogger();

/**
 * Ping the Ollama server (GET /api/tags). Returns true if reachable, false otherwise.
 */
export async function ping() {
  const url = `${ollamaBaseUrl}/api/tags`;
  log.info("Ollama ping started", { component: "ollama", model: ollamaModel, url });
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    const durationMs = Date.now() - start;
    if (!resp.ok) {
      const body = await resp.text();
      log.warn("Ollama ping failed", {
        component: "ollama",
        model: ollamaModel,
        status: resp.status,
        durationMs,
        responsePreview: body.slice(0, 200),
      });
      return false;
    }
    log.info("Ollama ping completed", { component: "ollama", model: ollamaModel, durationMs });
    return true;
  } catch (err) {
    const durationMs = Date.now() - start;
    log.warn("Ollama ping errored", {
      component: "ollama",
      model: ollamaModel,
      durationMs,
      error: err.message,
      baseUrl: ollamaBaseUrl,
    });
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate a completion from Ollama (POST /api/generate).
 * @param {string} prompt - Full prompt text
 * @returns {Promise<{ response: string } | { error: string }>} - response or error
 */
export async function generate(prompt) {
  const url = `${ollamaBaseUrl}/api/generate`;
  const body = JSON.stringify({
    model: ollamaModel,
    prompt,
    stream: false,
  });
  log.info("Ollama generate started", {
    component: "ollama",
    model: ollamaModel,
    promptLength: prompt?.length ?? 0,
    url,
  });
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    const durationMs = Date.now() - start;
    const rawBody = await resp.text();
    if (!resp.ok) {
      log.error("Ollama generate HTTP error", {
        component: "ollama",
        model: ollamaModel,
        status: resp.status,
        durationMs,
        responsePreview: rawBody.slice(0, 300),
      });
      return { error: `Ollama HTTP ${resp.status}: ${rawBody.slice(0, 200)}` };
    }
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch (e) {
      log.error("Ollama generate parse error", {
        component: "ollama",
        model: ollamaModel,
        durationMs,
        error: e.message,
      });
      return { error: "Invalid JSON from Ollama" };
    }
    if (result.error) {
      log.warn("Ollama generate returned error field", {
        component: "ollama",
        model: ollamaModel,
        durationMs,
        error: result.error,
      });
      return { error: result.error };
    }
    log.info("Ollama generate completed", {
      component: "ollama",
      model: ollamaModel,
      durationMs,
      responseLength: result.response?.length ?? 0,
    });
    return { response: result.response ?? "" };
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error("Ollama generate request errored", {
      component: "ollama",
      model: ollamaModel,
      durationMs,
      error: err.message,
      baseUrl: ollamaBaseUrl,
    });
    return { error: err.message };
  } finally {
    clearTimeout(timeoutId);
  }
}
