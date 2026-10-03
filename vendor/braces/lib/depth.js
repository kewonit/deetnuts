'use strict';

const { MAX_DEPTH } = require('./constants');

module.exports = depth => {
  if (depth > MAX_DEPTH) {
    const error = new RangeError(`Brace nesting depth exceeds maximum of ${MAX_DEPTH}`);
    error.code = 'BRACES_MAX_DEPTH';
    throw error;
  }
};
