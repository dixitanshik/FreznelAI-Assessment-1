
import { SystemTaskManager } from "../classes/SystemTaskManager.js";
import { SensorManager } from "../classes/SensorManager.js";

const taskManager = new SystemTaskManager();
const sensorManager = new SensorManager();

export const systemService = {
  getTasks() {
    return taskManager.getSummary();
  },

  getSensors() {
    return sensorManager.getSensors();
  }
};
