#!/usr/bin/env npx tsx
import express from "express";
import http, { IncomingMessage, OutgoingHttpHeader, OutgoingMessage } from "http";

type Args = {
  port: number;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let port = 3000; // default port
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-p" || args[i] === "--port") {
      port = parseInt(args[i + 1], 10);
      i++; // Skip next argument (the port number)
    }
  }
  return { port };
}

const { port } = parseArgs();

const app = express();
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = http.createServer(app);

// // Log when a new connection is made
server.on("connection", (socket) => {
  console.log("🟢 New connection established");
  socket.setTimeout(5000);

  socket.on("close", () => {
    console.log("🔴 Connection closed");
  });
});

// For any request, simply pipe the request stream to the response.
app.all("*", (req: IncomingMessage, res: OutgoingMessage) => {
  // Optionally, set the Content-Type header.
  // This sets the header to the incoming request's content type, or defaults to 'text/plain'.
  res.setHeader("Content-Type", req.headers["content-type"] ?? "text/plain");
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log({ ...req.headers });
  req.pipe(res);
});

server.listen(port, () => {
  console.log(`HTTP echo server is listening on http://localhost:${port}`);
});
