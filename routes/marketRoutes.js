import { Router } from "express";
import * as marketCtrl from "../controllers/marketController.js";

const router = Router();
router.get("/price", marketCtrl.getPrice);
router.get("/klines", marketCtrl.getKlines);

export default router;