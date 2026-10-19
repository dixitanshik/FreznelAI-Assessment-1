
import readline from "node:readline";
import os from "node:os";
import { SystemTaskManager } from "./SystemTaskManager.js";
import { SensorManager } from "./SensorManager.js";

export class CLIManager {
  constructor() {
    this.taskManager = new SystemTaskManager();
    this.sensorManager = new SensorManager();

    this.options = [
      "System overview",
      "Running processes",
      "Sensor information",
      "Refresh data",
      "Quit"
    ];

    this.selected = 0;
    this.view = "menu";
    this.tasks = null;
    this.sensorData = null;
    this.running = false;
    this.refreshing = false;

    this.handleKeypress = this.handleKeypress.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  async start() {
    this.running = true;

    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.resume();
    process.stdin.on("keypress", this.handleKeypress);
    process.stdout.on("resize", this.handleResize);

    await this.refresh();
  }

  async refresh() {
    if (this.refreshing || !this.running) return;

    this.refreshing = true;
    this.render();

    try {
      const [tasks, sensorData] = await Promise.all([
        this.taskManager.getSummary(),
        this.sensorManager.getSensors()
      ]);

      this.tasks = tasks;
      this.sensorData = sensorData;
    } catch (error) {
      console.error("Unable to read system information:", error.message);
    } finally {
      this.refreshing = false;
      this.render();
    }
  }

  handleKeypress(_character, key = {}) {
    if (!this.running) return;

    if (key.ctrl && key.name === "c") {
      this.stop();
      return;
    }

    if (key.name === "q" || key.name === "escape") {
      this.stop();
      return;
    }

    if (key.name === "r") {
      void this.refresh();
      return;
    }

    if (key.name === "backspace") {
      this.view = "menu";
      this.render();
      return;
    }

    if (key.name === "up" || key.name === "w") {
      if (this.view === "menu") {
        this.selected =
          (this.selected - 1 + this.options.length) %
          this.options.length;
      } else {
        this.view = "menu";
      }

      this.render();
      return;
    }

    if (key.name === "down" || key.name === "s") {
      if (this.view === "menu") {
        this.selected =
          (this.selected + 1) % this.options.length;
      } else {
        this.view = "menu";
      }

      this.render();
      return;
    }

    if (key.name === "return" || key.name === "enter") {
      this.selectOption();
    }
  }

  selectOption() {
    const choice = this.options[this.selected];

    switch (choice) {
      case "System overview":
        this.view = "overview";
        break;
      case "Running processes":
        this.view = "processes";
        break;
      case "Sensor information":
        this.view = "sensors";
        break;
      case "Refresh data":
        void this.refresh();
        return;
      case "Quit":
        this.stop();
        return;
      default:
        this.view = "menu";
    }

    this.render();
  }

  handleResize() {
    this.render();
  }

  writeLine(text = "") {
    const width = Math.max(20, process.stdout.columns || 80);
    process.stdout.write(
      text.length > width
        ? `${text.slice(0, width - 1)}…\n`
        : `${text}\n`
    );
  }

  render() {
    if (!this.running) return;

    // Clear the terminal and redraw at its current dimensions.
    process.stdout.write("\x1b[2J\x1b[H");

    const width = Math.max(
      40,
      Math.min(process.stdout.columns || 80, 110)
    );

    const border = "─".repeat(width - 2);

    this.writeLine(`┌${border}┐`);
    this.writeLine(
      `│ ${"FREZNEL AI • SYSTEM CONSOLE".padEnd(width - 4)} │`
    );
    this.writeLine(`├${border}┤`);
    this.writeLine(
      `│ Host: ${(os.hostname()).slice(0, width - 11).padEnd(width - 11)} │`
    );

    if (this.refreshing) {
      this.writeLine(`│ Collecting system information...`.padEnd(width - 1) + "│");
    }

    if (this.view === "menu") {
      this.writeLine(`├${border}┤`);
      this.writeLine("│ Navigate with ↑/↓ or W/S; press Enter.".padEnd(width - 1) + "│");
      this.writeLine(`├${border}┤`);

      this.options.forEach((option, index) => {
        const marker = index === this.selected ? ">" : " ";
        this.writeLine(
          `│ ${marker} ${option}`.padEnd(width - 1) + "│"
        );
      });

      this.writeLine(`├${border}┤`);
      this.writeLine(
        `│ CPU: ${(this.tasks?.cpuUsagePercent ?? 0).toFixed(1)}% | Processes: ${this.tasks?.processCount ?? "—"}`
          .padEnd(width - 1) + "│"
      );
    } else if (this.view === "overview") {
      this.writeLine(`├${border}┤`);
      this.writeLine("│ SYSTEM OVERVIEW".padEnd(width - 1) + "│");
      this.writeLine(
        `│ OS: ${this.tasks?.distro || this.tasks?.platform || "Loading"}`
          .padEnd(width - 1) + "│"
      );
      this.writeLine(
        `│ Architecture: ${this.tasks?.arch || "—"}`
          .padEnd(width - 1) + "│"
      );
      this.writeLine(
        `│ CPU usage: ${(this.tasks?.cpuUsagePercent ?? 0).toFixed(1)}%`
          .padEnd(width - 1) + "│"
      );
      this.writeLine(
        `│ Processes: ${this.tasks?.processCount ?? "—"}`
          .padEnd(width - 1) + "│"
      );
      this.writeLine(
        `│ Memory usage: ${this.tasks?.memory ? this.tasks.memory.usedPercent.toFixed(1) + "%" : "Unavailable"}`
          .padEnd(width - 1) + "│"
      );
      this.writeLine(
        `│ Uptime: ${this.formatUptime(this.tasks?.uptimeSeconds || 0)}`
          .padEnd(width - 1) + "│"
      );
    } else if (this.view === "processes") {
      this.writeLine(`├${border}┤`);
      this.writeLine("│ RUNNING PROCESSES (top 15 by CPU)".padEnd(width - 1) + "│");

      for (const process of (this.tasks?.processes || []).slice(0, 15)) {
        const nameWidth = Math.max(10, width - 34);
        const name = process.name.slice(0, nameWidth).padEnd(nameWidth);

        this.writeLine(
          `│ ${String(process.pid).padEnd(7)} ${name} ${process.cpu.toFixed(1).padStart(6)}%`
            .padEnd(width - 1) + "│"
        );
      }
    } else if (this.view === "sensors") {
      this.writeLine(`├${border}┤`);
      this.writeLine("│ SENSOR INFORMATION".padEnd(width - 1) + "│");

      for (const sensor of this.sensorData?.sensors || []) {
        const value = sensor.available
          ? `${sensor.value}${sensor.unit}`
          : "Unavailable";

        this.writeLine(
          `│ ${sensor.name}: ${value}`
            .padEnd(width - 1) + "│"
        );
      }
    }

    this.writeLine(`└${border}┘`);
    this.writeLine(
      "R: Refresh | ↑/↓: Navigate/back | Backspace: Menu | Q/Esc: Quit"
    );
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  stop() {
    if (!this.running) return;

    this.running = false;

    process.stdin.off("keypress", this.handleKeypress);
    process.stdout.off("resize", this.handleResize);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    process.stdin.pause();
    process.stdout.write("\x1b[2J\x1b[HCLI closed.\n");
  }
}
