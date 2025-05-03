const playwright = require('playwright');
const BobaBrowser = require('./BobaBrowser');

class BobaPlaywright extends BobaBrowser {
    /*
        * Create a new BobaPlaywright instance
        * @param {string} browserType - Type of browser (firefox, chromium, webkit)
    */
  constructor(browserType = 'firefox') {
    super();
    this.browserType = browserType;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.lastInteraction = 0;
    this.isInteracting = false;
    this.viewportSize = { width: 1280, height: 720 };
  }
  
  /**
   * Initialize the Firefox browser using Playwright
   * @param {Object} options - Browser initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      switch (this.browserType) {
        case 'firefox':
          this.browser = await playwright.firefox.launch({
            headless: true
          });
          break;
        case 'chromium':
          this.browser = await playwright.chromium.launch({
            headless: true
          });
          break;
        case 'webkit':
          this.browser = await playwright.webkit.launch({
            headless: true
          });
          break;
        default:
          throw new Error(`Unsupported browser type: ${this.browserType}`);
      }
      const viewportWidth = options.viewportWidth || 1280;
      const viewportHeight = options.viewportHeight || 720;
      this.viewportSize = { width: viewportWidth, height: viewportHeight };
      
      this.context = await this.browser.newContext({
        viewport: this.viewportSize
      });
      
      this.page = await this.context.newPage();
      const url = options?.url || 'https://pages.klash.dev/search';
      await this.navigate(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error initializing BobaPlaywright:', error);
      throw error;
    }
  }
  
  /**
   * Navigate to a URL
   * @param {string} url - The URL to navigate to
   * @returns {Promise<void>}
   */
  async navigate(url) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      this.isInteracting = true;
      await this.page.goto(url);
      this.lastInteraction = Date.now();
      this.isInteracting = false;
    } catch (error) {
      this.isInteracting = false;
      console.error('Navigation error:', error);
      throw error;
    }
  }
  
  /**
   * Wait for the browser to be ready for interaction
   * @param {number} minDelay - Minimum delay after last interaction
   * @returns {Promise<void>}
   * @private 
   */
  async _waitForReady(minDelay = 100) {
    const timeSinceLastInteraction = Date.now() - this.lastInteraction;
    if (timeSinceLastInteraction < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastInteraction));
    }
    while (this.isInteracting) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  /**
   * Click at a specific coordinate
   * @param {number} x - X coordinate from client
   * @param {number} y - Y coordinate from client
   * @returns {Promise<void>}
   */
  async click(x, y) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this._waitForReady();
      this.isInteracting = true;
      
      // ensure not negative
      x = Math.max(0, parseInt(x) || 0);
      y = Math.max(0, parseInt(y) || 0);
      
      await this.page.mouse.click(x, y);
      this.lastInteraction = Date.now();
      this.isInteracting = false;

      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      this.isInteracting = false;
      console.error('Click error:', error);
      throw error;
    }
  }
  
  /**
   * Type text
   * @param {string} text - The text to type
   * @returns {Promise<void>}
   */
  async type(text) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this._waitForReady();
      this.isInteracting = true;
      await this.page.keyboard.press(text);
      
      this.lastInteraction = Date.now();
      this.isInteracting = false;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      this.isInteracting = false;
      console.error('Type error:', error);
      throw error;
    }
  }
  
  /**
   * Capture a screenshot of the current page
   * @returns {Promise<Buffer>} - Screenshot as a Buffer
   */
  async screenshot() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this._waitForReady(50);
      
      return await this.page.screenshot({ 
        type: 'jpeg', 
        quality: 100,
        timeout: 50000
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
  
  /**
   * Close the browser and clean up resources
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}

module.exports = BobaPlaywright;