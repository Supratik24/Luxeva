
import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment
} from "../controllers/paymentController.js";

const router = Router();

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);

export default router;