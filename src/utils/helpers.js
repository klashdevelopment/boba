/**
 * Helper utility functions for the Boba application
 */

/**
 * Parse command line arguments to get browser type
 * @returns {string} - Browser type ('playwright')
 */
function parseBrowserTypeFromArgs() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      // Check for --browser=value or --browser value format
      if (args[i].startsWith('--browser=')) {
        return args[i].split('=')[1];
      } else if (args[i] === '--browser' && i + 1 < args.length) {
        return args[i + 1];
      }
    }
    
    // Default to playwright if not specified
    return 'playwright';
  }
  
  /**
   * Format a Base64 image string from a buffer
   * @param {Buffer} buffer - Buffer containing image data
   * @returns {string} - Base64 encoded string
   */
  function formatImageDataUrl(buffer) {
    return buffer.toString('base64');
  }
  
  /**
   * Generate a unique session ID
   * @returns {string} - Unique session ID
   */
  function generateSessionId() {
    return `boba_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Safely parse JSON with error handling
   * @param {string} jsonString - JSON string to parse
   * @param {*} defaultValue - Default value to return if parsing fails
   * @returns {*} - Parsed object or default value
   */
  function safeJsonParse(jsonString, defaultValue = {}) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return defaultValue;
    }
  }
  
  /**
   * Safely stringify JSON with error handling
   * @param {*} value - Value to stringify
   * @param {string} defaultValue - Default string to return if stringify fails
   * @returns {string} - JSON string or default value
   */
  function safeJsonStringify(value, defaultValue = '{}') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('Error stringifying JSON:', error);
      return defaultValue;
    }
  }
  
  module.exports = {
    parseBrowserTypeFromArgs,
    formatImageDataUrl,
    generateSessionId,
    safeJsonParse,
    safeJsonStringify
  };