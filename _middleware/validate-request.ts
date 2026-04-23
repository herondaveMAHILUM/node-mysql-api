import { NextFunction, Request } from "express";
import Joi from "joi";

export function validateRequest(req: Request, next: NextFunction, schema: Joi.ObjectSchema): void {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  };

  const { error, value } = schema.validate(req.body, options);
  if (error) {
    next(`Validation error: ${error.details.map((x) => x.message).join(", ")}`);
    return;
  }

  req.body = value;
  next();
}
