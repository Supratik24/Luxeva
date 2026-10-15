import { validationResult } from "express-validator";

/**
 * Validates request using express-validator results.
 * Returns structured 422 Unprocessable Entity with exact field-level errors.
 */
export const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formattedErrors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? err.value : null
    }));

    return res.status(422).json({
      success: false,
      message: "Input validation failed. Please check the submitted fields.",
      errors: formattedErrors
    });
  }

  next();
};
