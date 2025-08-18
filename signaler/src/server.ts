Bun.serve({
  port: 8001,
  tls: process.env.NODE_ENV === "development" ? {
    cert: Bun.file('./certs/fullchain.pem'),
    key: Bun.file('./certs/server-key.pem'),
  } : undefined,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed", {status: 500});
  },
  websocket: {
    open(ws) {
      console.log(`Open ${ws.remoteAddress}`);
    },
    close(ws, code, message) {
      console.log(`Close ${ws.remoteAddress}`);
    },
    message(ws, message) {
      console.log(`${message}`);
    },
    drain(ws) {
    }
  },
});
