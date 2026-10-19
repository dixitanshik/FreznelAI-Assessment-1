
import { CLIManager } from "../classes/CLIManager.js";

const cli = new CLIManager();

cli.start().catch((error) => {
  console.error("Failed to start the system CLI:", error);
  process.exitCode = 1;
});
