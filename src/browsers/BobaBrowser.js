class BobaBrowser {
    /**
     * Initialize the browser
     * @param {Object} options - Browser initialization options
     * @returns {Promise<void>}
     */
    async initialize(options = {}) {
        throw new Error('Method initialize() must be implemented by subclass');
    }

    /**
     * Navigate to a URL
     * @param {string} url - The URL to navigate to
     * @returns {Promise<void>}
     */
    async navigate(url) {
        throw new Error('Method navigate() must be implemented by subclass');
    }

    /**
     * Click at a specific coordinate
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Promise<void>}
     */
    async click(x, y) {
        throw new Error('Method click() must be implemented by subclass');
    }

    /**
     * Type text
     * @param {string} text - The text to type
     * @returns {Promise<void>}
     */
    async type(text) {
        throw new Error('Method type() must be implemented by subclass');
    }

    /**
     * Capture a screenshot of the current page
     * @returns {Promise<Buffer>} - Screenshot as a Buffer
     */
    async screenshot() {
        throw new Error('Method screenshot() must be implemented by subclass');
    }

    /**
     * Close the browser and clean up resources
     * @returns {Promise<void>}
     */
    async close() {
        throw new Error('Method close() must be implemented by subclass');
    }
}

module.exports = BobaBrowser;