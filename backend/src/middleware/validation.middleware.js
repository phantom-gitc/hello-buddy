const ApiError = require('../utils/ApiError');

/**
 * Higher-order middleware to validate req.body, req.query, or req.params using a Zod schema
 * @param {object} schemas - { body: ZodSchema, query: ZodSchema, params: ZodSchema }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(
          ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', formattedErrors)
        );
      }
      return next(ApiError.badRequest(error.message, 'VALIDATION_ERROR'));
    }
  };
};

module.exports = validate;
