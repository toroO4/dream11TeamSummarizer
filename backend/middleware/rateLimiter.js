const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Increased from 100 to 300
  message: 'Too many requests from this IP, please try again later.'
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50, // Increased from 10 to 50 
  message: 'Too many API requests, please try again in a minute.'
});

// Add a more lenient limiter for frequent operations like validation
const moderateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many validation requests, please try again in a minute.'
});

module.exports = { limiter, strictLimiter, moderateLimiter }; 