const playwright = require('playwright');
const BobaBrowser = require('./BobaBrowser');

class BobaPlaywright extends BobaBrowser {
  /**
   * Create a new BobaPlaywright instance
   * @param {string} browserType - Type of browser (firefox, chromium, webkit, edge)
   */
  constructor(browserType = 'firefox') {
    super();
    this.browserType = browserType;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.viewportSize = { width: 1280, height: 720 };
    this.quality = 80; // default screenshot quality
  }
  
  /**
   * Initialize the Firefox browser using Playwright
   * @param {Object} options - Browser initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {headless: true}) {
    try {
      switch (this.browserType) {
        case 'firefox':
          this.browser = await playwright.firefox.launch({
            headless: options.headless,
            firefoxUserPrefs: {
              "javascript.options.wasm_js_promise_integration": true
            }
          });
          break;
        case 'chromium':
          this.browser = await playwright.chromium.launch({
            headless: options.headless,
            args: ['--js-flags=#enable-webassembly-jspi']
          });
          break;
        case 'webkit':
          this.browser = await playwright.webkit.launch({
            headless: options.headless
          });
          break;
        case 'edge':
          this.browser = await playwright.chromium.launch({
            headless: options.headless,
            channel: 'msedge',
            args: ['--js-flags=#enable-webassembly-jspi']
          });
          break;
        case 'brave':
          this.browser = await playwright.chromium.launch({
            headless: options.headless,
            executablePath: `C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
            args: ['--js-flags=#enable-webassembly-jspi']
          });
          break;
        default:
          throw new Error(`Unsupported browser type: ${this.browserType}`);
      }
      
      const viewportWidth = parseInt(options.viewportWidth) || 1280;
      const viewportHeight = parseInt(options.viewportHeight) || 720;
      
      this.viewportSize = { 
        width: viewportWidth, 
        height: viewportHeight 
      };
      this.context = await this.browser.newContext({
        viewport: this.viewportSize,
        deviceScaleFactor: 1.0
      });

      this.context.route('**://**example.com/**', async (route) => {
        console.log('Intercepted request to:', route.request().url());
        const reqUrl = route.request().url();
        let path = reqUrl.replace(/^https?:\/\/(www\.)?example\.com\/?/, '');
        if(path === '' || path.endsWith('/')) {
          path += 'index.html';
        }
        const fs = require('fs');
        const configPath = require('path').join('{DIR}/../../local/'.replace('{DIR}', __dirname), 'local.json');
        let config = null;
        if (fs.existsSync(configPath)) {
          const rawData = fs.readFileSync(configPath);
          config = JSON.parse(rawData);
        } else {
          return route.fulfill({
            status: 404,
            body: 'Not Found -- example.com boba request -- config file missing!! please copy from repo if you deleted it!!'
          });
        }

        if(!config.local || !config.local.enabled) {
          return route.continue();
        }
        
        const localPath = require('path').join(config.local.folder.replace('{DIR}', __dirname), path);
        console.log('Serving local file:', localPath);
        if (fs.existsSync(localPath)) {
          const content = fs.readFileSync(localPath);
          route.fulfill({
            body: content
          });
        } else {
          route.fulfill({
            status: 404,
            body: 'Not Found -- example.com boba request -- page not found'
          });
        }
      });
      
      this.page = await this.context.newPage();
      const url = options?.url || 'https://pages.klash.dev/search';
      await this.navigate(url);
      
      return { success: true, viewportSize: this.viewportSize };
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
      await this.page.goto(url);
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
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
      x = Math.max(0, parseInt(x) || 0);
      y = Math.max(0, parseInt(y) || 0);
      
      await this.page.mouse.click(x, y);
    } catch (error) {
      console.error('Click error:', error);
      throw error;
    }
  }

  /**
   * Resize the browser viewport
   * @param {number} width - Width of the viewport
   * @param {number} height - Height of the viewport
   * @returns {Promise<void>}
   */
  async resize(width, height) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    try {
      const parsedWidth = parseInt(width, 10);
      const parsedHeight = parseInt(height, 10);
      width = Math.min(2000, Math.max(100, Number.isNaN(parsedWidth) ? 1280 : parsedWidth));
      height = Math.min(2000, Math.max(100, Number.isNaN(parsedHeight) ? 720 : parsedHeight));
      this.viewportSize = { width, height };
      await this.page.setViewportSize(this.viewportSize);
    } catch (error) {
      console.error('Resize error:', error);
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
      await this.page.keyboard.press(text);
    } catch (error) {
      console.error('Type error:', error);
      throw error;
    }
  }

  /**
   * Move mouse to a specific coordinate
   * @param {number} x - X coordinate from client
   * @param {number} y - Y coordinate from client
   * @returns {Promise<void>}
   */
  async mouseMove(x, y) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      x = Math.max(0, parseInt(x) || 0);
      y = Math.max(0, parseInt(y) || 0);
      
      await this.page.mouse.move(x, y);
    } catch (error) {
      console.error('Mouse move error:', error);
      throw error;
    }
  }

  /**
   * Quality setting for screenshots
   * @param {number} quality - Quality (1-100)
   * @returns {Promise<void>}
   */
  async setQuality(quality) {
    const parsedQuality = parseInt(quality, 10);
    this.quality = Math.min(100, Math.max(1, Number.isNaN(parsedQuality) ? 80 : parsedQuality));
  }

  /**
   * Inject JavaScript into the page
   * @param {string} js - The JavaScript code to inject
   * @returns {Promise<void>}
   * */
  async injectJs(js) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this.page.evaluate(js);
    } catch (error) {
      console.error('Inject JS error:', error);
      throw error;
    }
  }

  /**
   * Called on wheel to scroll the page
   * @param {number} deltaX - Scroll delta
   * @param {number} deltaY - Scroll delta
   * * @returns {Promise<void>}
   */
  async scroll(deltaX, deltaY) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this.page.mouse.wheel(deltaX, deltaY);
    } catch (error) {
      console.error('Scroll error:', error);
      throw error;
    }
  }

  /**
   * Go back in the browser history
   * @returns {Promise<void>}
   */
  async back() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this.page.goBack();
    } catch (error) {
      console.error('Back error:', error);
      throw error;
    }
  }

  /**
   * Go forward in the browser history
   * @returns {Promise<void>}
   */
  async forward() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      await this.page.goForward();
    } catch (error) {
      console.error('Forward error:', error);
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
      return await this.page.screenshot({ 
        type: 'jpeg', 
        quality: this.quality || 80,
        timeout: 100000
      });
    } catch (error) {
      if(error.message.includes('ms exceeded') || error.message.includes('has been closed')) {
        return "Screenshot timeout (session has died)";
      } else {
        console.error('Screenshot error:', error);
      }
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