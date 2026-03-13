const baseUrl = process.env.API_BASE_URL || "http://localhost:3002";
const docsUrl = `${baseUrl}/api/docs/`;
const specUrl = `${baseUrl}/api/docs.json`;

async function main() {
  const status = await fetchStatus(specUrl);

  console.log(`Swagger UI: ${docsUrl}`);
  console.log(`OpenAPI JSON: ${specUrl}`);

  if (status === 200) {
    console.log("Docs endpoint status: reachable");
  } else {
    console.log(`Docs endpoint status: unavailable (HTTP ${status ?? "error"})`);
    console.log("Start the API first with: npm start");
  }
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url);
    return response.status;
  } catch {
    return null;
  }
}

main();
