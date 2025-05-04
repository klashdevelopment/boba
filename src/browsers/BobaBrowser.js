class BobaBrowser {
    /**
     * Initialize the browser
     * @param {Object} options - Browser initialization options
     * @returns {Promise<void>}
     */
    async initialize(options = {headless: true}) {
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
     * Mouse move to a specific coordinate
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Promise<void>}
     */
    async mouseMove(x, y) {
        throw new Error('Method mouseMove() must be implemented by subclass');
    }

    /**
     * Inject JavaScript into the page
     * @param {string} js - The JavaScript code to inject
     * @returns {Promise<void>}
     */
    async injectJs(js) {
        throw new Error('Method injectJs() must be implemented by subclass');
    }

    /**
     * Called on wheel to scroll the page
     * @param {number} deltaX - Horizontal scroll amount
     * @param {number} deltaY - Vertical scroll amount
     * @returns {Promise<void>}
    */
    async scroll(deltaX, deltaY) {
        throw new Error('Method scroll() must be implemented by subclass');
    }

    /**
     * Go back in the browser history
     * @returns {Promise<void>}
     */
    async back() {
        throw new Error('Method back() must be implemented by subclass');
    }

    /**
     * Go forward in the browser history
     * @returns {Promise<void>}
     */
    async forward() {
        throw new Error('Method forward() must be implemented by subclass');
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