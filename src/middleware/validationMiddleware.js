import { param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return formatted errors.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format the express-validator output to be clean and beginner-friendly
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${errorMessages}`
    });
  }
  next();
};

/**
 * Validator rules for analyze and get single profile endpoints
 */
export const validateUsername = [
  param('username')
    .trim()
    .notEmpty()
    .withMessage('GitHub username parameter is required')
    .matches(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i)
    .withMessage('Invalid GitHub username format. Usernames can only contain alphanumeric characters and hyphens, and cannot start or end with a hyphen.'),
  handleValidationErrors
];

/**
 * Validator rules for listing profiles (query parameters)
 */
export const validateQueryFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('search')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Search query must be a string'),
  query('tier')
    .optional({ checkFalsy: true })
    .isIn(['S', 'A', 'B', 'C', 's', 'a', 'b', 'c'])
    .withMessage('Developer tier must be one of: S, A, B, or C'),
  query('sortBy')
    .optional({ checkFalsy: true })
    .isIn(['username', 'name', 'followers', 'public_repos', 'popularity_score', 'activity_score', 'analyzed_at'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional({ checkFalsy: true })
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC'),
  handleValidationErrors
];
