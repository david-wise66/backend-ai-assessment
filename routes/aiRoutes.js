import { Router } from "express";
import * as aiCtrl from "../controllers/aiController.js";

const router = Router();


router.post("/", aiCtrl.askQuestion);

export default router;