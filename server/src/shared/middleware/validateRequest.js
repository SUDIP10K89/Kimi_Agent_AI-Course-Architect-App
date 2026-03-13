import { validationResult } from 'express-validator';

export const validateRequest = (checks) => async (req, res, next) => {
  await Promise.all(checks.map((check) => check.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
    });
  }

  next();
};

export default validateRequest;
