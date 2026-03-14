# AI Bitcoin Trading Backend - Implementation Notes

## 1. Architectural Overview
This project was refactored from a monolithic script into a modular **Route-Controller-Service** architecture. This separation of concerns ensures that the application is:
- **Scalable**: New assets or AI providers can be added without modifying the core server logic.
- **Testable**: Business logic in the `lib/` services can be unit-tested independently of the Express framework.
- **Maintainable**: Clearer folder structure for team collaboration.

## 2. Market Data Integration
- **Source**: Binance Public REST API.
- **Implementation**: Utilizes the `klines` (candlestick) and `ticker/price` endpoints.
- **Technical Choice**: Chose Binance for its high reliability and zero-authentication requirement for public data, allowing for an immediate, functional MVP.

## 3. Hybrid AI Strategy (Local + Cloud)
To address the hardware constraints of cloud hosting while maintaining a functional live demo, I implemented a hybrid logic in `lib/ollama.js`:
- **Development (Local)**: Connects to a local **Ollama** instance (`llama3.2`) to allow for private, cost-free development and testing.
- **Production (Cloud)**: Automatically detects the `production` environment and routes requests to **Groq Cloud (Llama 3.1)**. This ensures the live URL provided is 100% functional and responsive without requiring a GPU-enabled cloud instance.

## 4. Enhanced Prompt Engineering
The `/api/ask` endpoint does not simply pass the user's string to the LLM. It injects a **Market Context** block including:
- Current BTC/USDT price.
- Last 5 hourly closing prices to provide the model with recent trend data.
This allows the AI to provide context-aware financial analysis rather than generic responses.

## 5. Production Standards & Logging
- **Structured Logging**: Replaced all `console.log` statements with **`nj-logger`**.
- **Observability**: Logs include Request IDs, durations, and HTTP status codes in JSON format, ready for ingestion by tools like Datadog or ELK.
- **Error Handling**: Implemented robust `try/catch` blocks and `AbortController` timeouts for all external API calls to prevent hanging processes.

## 6. Deployment & Reverse Proxy
- **Hosting**: Deployed on **Render**.
- **Reverse Proxy**: The application is served behind Render's managed **Nginx/Load Balancer** infrastructure. This handles SSL termination, port forwarding (mapping port 80/443 to the Node process on port 10000), and provides a production-grade shield for the application, as per the assessment requirements.

## 7. Known Issues & Trade-offs
- **Real-time Latency**: Currently uses REST polling. For a full production system, I would transition to **WebSockets** for the market data feed.
- **Rate Limiting**: In a high-traffic scenario, I would implement **Redis caching** for Binance responses to stay within API rate limits.