import express from "express";
import { protect } from "@luxeva/shared";
import {
  addAddress,
  deleteAddress,
  getMe,
  listAddresses,
  syncCurrentUser,
  updateAddress,
  updateProfile
} from "../controllers/authController.js";

const router = express.Router();

router.use(protect);
router.post("/sync", syncCurrentUser);
router.get("/me", getMe);
router.put("/profile", updateProfile);
router.get("/addresses", listAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

export default router;
