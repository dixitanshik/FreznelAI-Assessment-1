
import test from "node:test";
import assert from "node:assert/strict";

import { SystemTaskManager } from "../src/classes/SystemTaskManager.js";
import { SensorManager } from "../src/classes/SensorManager.js";

test("SystemTaskManager returns system information", async () => {
  const manager = new SystemTaskManager();
  const result = await manager.getSummary();

  assert.equal(typeof result.hostname, "string");
  assert.equal(typeof result.platform, "string");
  assert.ok(Array.isArray(result.processes));
  assert.equal(typeof result.cpuUsagePercent, "number");
});

test("Process records contain expected fields", async () => {
  const manager = new SystemTaskManager();
  const result = await manager.getSummary();

  for (const process of result.processes) {
    assert.equal(typeof process.pid, "number");
    assert.equal(typeof process.name, "string");
    assert.equal(typeof process.cpu, "number");
    assert.equal(typeof process.memory, "number");
  }
});

test("SensorManager returns valid sensor records", async () => {
  const manager = new SensorManager();
  const result = await manager.getSensors();

  assert.ok(Array.isArray(result.sensors));

  for (const sensor of result.sensors) {
    assert.equal(typeof sensor.id, "string");
    assert.equal(typeof sensor.name, "string");
    assert.equal(typeof sensor.available, "boolean");

    if (!sensor.available) {
      assert.equal(sensor.value, null);
    }
  }
});
