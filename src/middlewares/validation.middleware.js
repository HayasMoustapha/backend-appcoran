import { AppError } from './error.middleware.js';

// Zod validation wrapper for body/query/params.
export function validate(schema, location = 'body') {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[location]);
      req[location] = data;
      return next();
    } catch (err) {
      const details = err?.issues?.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }));
      const error = new AppError('Validation error', 400);
      error.details = details || [];
      return next(error);
    }
  };
}
