
import { systemService } from "../services/systemService.js";

export async function getTasks(req, res, next) {
  try {
    const data = await systemService.getTasks();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSensors(req, res, next) {
  try {
    const data = await systemService.getSensors();
    res.json(data);
  } catch (error) {
    next(error);
  }
}
