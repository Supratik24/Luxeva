import { validationResult } from "express-validator";
import { ApiError } from "./errorHandler.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, "Validation failed", errors.array()));
  }

  next();
};

