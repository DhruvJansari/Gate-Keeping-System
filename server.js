// server.js
const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// cPanel will set PORT; fall back to 3000 locally
const port = process.env.PORT || 3000;

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) {
        console.error("Error starting server:", err);
        process.exit(1);
      }
      console.log(
        `> Ready on http://localhost:${port} (env: ${process.env.NODE_ENV || "development"})`,
      );
    });
  })
  .catch((err) => {
    console.error("Error preparing Next.js app:", err);
    process.exit(1);
  });
