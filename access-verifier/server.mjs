import { createServer } from "node:http";
import { AccessTokenVerifier, validateConfig } from "./verify.mjs";

const verifier = new AccessTokenVerifier(validateConfig());
const port = Number(process.env.PORT || 8081);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("PORT must be an integer between 1024 and 65535");
}

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method === "GET" && request.url === "/healthz") {
    response.writeHead(200).end("ok\n");
    return;
  }

  if (request.method !== "GET" || request.url !== "/verify") {
    response.writeHead(404).end();
    return;
  }

  const token = request.headers["x-access-jwt"];
  if (typeof token !== "string") {
    response.writeHead(401).end();
    return;
  }

  try {
    await verifier.verify(token);
    response.writeHead(204).end();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        error instanceof Error ? error.message : "Access verification failed",
      );
    }
    response.writeHead(401).end();
  }
});

server.headersTimeout = 10_000;
server.requestTimeout = 10_000;
server.keepAliveTimeout = 5_000;
server.maxHeadersCount = 32;

server.listen(port, "0.0.0.0");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
