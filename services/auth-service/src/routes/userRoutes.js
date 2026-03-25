import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import { getUserById, getUsers, updateUser } from "../controllers/userController.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);

export default router;

