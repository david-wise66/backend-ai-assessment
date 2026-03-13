export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "AI Bitcoin Trading Backend API",
    version: "1.0.0",
    description: "Manual testing docs for health, market, and ask endpoints.",
  },
  servers: [
    {
      url: "http://localhost:3002",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Market" },
    { name: "AI" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Service health and Ollama reachability",
        responses: {
          200: {
            description: "Health status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/market/price": {
      get: {
        tags: ["Market"],
        summary: "Get current BTC price",
        parameters: [
          {
            name: "symbol",
            in: "query",
            required: false,
            schema: { type: "string", default: "BTCUSDT" },
            description: "Trading pair symbol.",
          },
        ],
        responses: {
          200: {
            description: "Current price",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MarketPriceResponse" },
              },
            },
          },
          502: {
            description: "Upstream market API error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/market/klines": {
      get: {
        tags: ["Market"],
        summary: "Get BTC candlestick data",
        parameters: [
          {
            name: "symbol",
            in: "query",
            required: false,
            schema: { type: "string", default: "BTCUSDT" },
          },
          {
            name: "interval",
            in: "query",
            required: false,
            schema: { type: "string", default: "1h" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 24, minimum: 1, maximum: 1500 },
          },
        ],
        responses: {
          200: {
            description: "Kline list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/KlinesResponse" },
              },
            },
          },
          502: {
            description: "Upstream market API error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ask": {
      post: {
        tags: ["AI"],
        summary: "Ask Ollama with optional market context",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AskRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Generated answer",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AskResponse" },
              },
            },
          },
          400: {
            description: "Invalid request body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          502: {
            description: "Ollama upstream error",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ErrorResponse" },
                    {
                      type: "object",
                      properties: { answer: { type: "null" } },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          ollama: {
            type: "string",
            enum: ["reachable", "unreachable"],
            example: "reachable",
          },
        },
        required: ["ok", "ollama"],
      },
      MarketPriceResponse: {
        type: "object",
        properties: {
          symbol: { type: "string", example: "BTCUSDT" },
          price: { type: "string", example: "71216.21000000" },
        },
        required: ["symbol", "price"],
      },
      KlinesResponse: {
        type: "object",
        properties: {
          symbol: { type: "string", example: "BTCUSDT" },
          klines: {
            type: "array",
            items: {
              type: "array",
              items: { oneOf: [{ type: "string" }, { type: "number" }, { type: "integer" }] },
            },
          },
        },
        required: ["symbol", "klines"],
      },
      AskRequest: {
        type: "object",
        properties: {
          question: { type: "string", example: "What is current BTC risk?" },
        },
        required: ["question"],
      },
      AskResponse: {
        type: "object",
        properties: {
          answer: { type: "string", example: "BTC looks volatile in the near term." },
        },
        required: ["answer"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Upstream error" },
        },
        required: ["error"],
      },
    },
  },
};
