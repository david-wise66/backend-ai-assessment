# AI Bitcoin Trading Backend - Implementation Notes

## Architectural Choices
- **Modular Refactor**: Decoupled the boilerplate into a **Route-Controller-Service** pattern. This ensures the API is scalable and follows the Principle of Separation of Concerns.
- **Structured Logging**: Replaced all `console.log` instances with `nj-logger`. This provides production-grade observability with timestamps and severity levels.
- **Enhanced AI Context**: The `/api/ask` endpoint does not just send a raw question. It injects a "Financial Context" block containing the current BTC price and the last 5 hourly closing trends to provide the LLM with actionable data.

## Market Data Source
- **Provider**: Binance Public REST API.
- **Reasoning**: It provides high-fidelity data without the need for API keys, making the MVP easy to deploy and test immediately.

## Trade-offs & Future Improvements
- **Local LLM**: Used `llama3.2:1b` for the assessment to ensure low latency on consumer hardware. For production, I would recommend a larger model (8B+) or a dedicated GPU-hosted instance.
- **Caching**: Currently, every AI request fetches fresh market data. In a high-traffic scenario, I would implement **Redis caching** (5-10 second TTL) for market data to prevent rate-limiting.
- **Real-time Data**: For the full platform, I would transition from REST polling to **WebSockets** for real-time price updates.

## Deployment
- Hosted behind **Nginx** acting as a reverse proxy to handle SSL termination and port forwarding.