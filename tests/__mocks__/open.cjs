/**
 * Mock for 'open' package
 * Prevents ESM import errors in Jest tests
 */
module.exports = async function open(url, options) {
  // Mock implementation - just log or return
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }
  // In real usage, this would open the browser
  return Promise.resolve();
};

