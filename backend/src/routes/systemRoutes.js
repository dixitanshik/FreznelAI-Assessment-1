
import { Router } from "express";
import {
  getTasks,
  getSensors
} from "../controllers/systemController.js";

const router = Router();

router.get("/tasks", getTasks);
router.get("/sensors", getSensors);

export default router;