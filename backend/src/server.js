
import app from "./app.js";

const PORT = Number(process.env.PORT || 4000);

const server = app.listen(PORT, () => {
  console.log(
    `System Viewer API running at http://localhost:${PORT}`
  );
});

process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.close(() => process.exit(0));
});
