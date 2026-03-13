# Assessment Notes

## Market data source choice

- Source: Binance public Spot REST API.
- Endpoints used:
  - `GET /api/v3/ticker/price` for current BTC price.
  - `GET /api/v3/klines` for historical candlestick data.
- Auth: none required for selected read-only endpoints.

## Design goals

- Keep the service backend-only and minimal while still production-oriented.
- Separate concerns by module:
  - `lib/market.js` for exchange integration.
  - `lib/ollama.js` for local LLM integration.
  - `server.js` for routing and request lifecycle.
- Make all critical values environment-driven via `lib/config.js`.

## Logging and error handling

- Uses `nj-logger` globally and request middleware for per-request telemetry.
- Library modules log structured events (component, status, duration, symbol/model).
- Route handlers map upstream failures to `502` and validation issues to `400`.
- Ollama timeouts use `AbortController` to avoid hanging requests.

## Trade-offs

- Ollama calls are synchronous (`stream: false`) for simpler API responses.
- `/api/ask` enriches context with latest price only (not klines) to keep latency lower.
- Market and Ollama HTTP calls are done on-demand; no caching is applied.

## Extension ideas

- Add response streaming for `/api/ask`.
- Add in-memory cache for ticker/klines with short TTL.
- Add retry and circuit-breaker behavior for upstream transient failures.
- Add auth/rate limiting if exposing publicly.
- Add integration tests with mocked upstream servers in CI.

## Known issues / assumptions

- `/api/ask` and Ollama health status depend on a locally running Ollama instance.
- Public hosting behind nginx requires external process management (systemd/pm2/container).
