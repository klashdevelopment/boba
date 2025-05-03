/**
 * BobaServer - Express server for browser streaming
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const SessionManager = require('./SessionManager');

class BobaServer {
    /**
     * Create a new BobaServer instance
     * @param {Object} options - Server configuration options
     */
    constructor(options = {}) {
        this.options = {
            port: options.port || process.env.PORT || 3000,
            defaultBrowserType: options.defaultBrowserType || 'playwright',
            publicDir: options.publicDir || path.join(process.cwd(), 'public'),
            defaultFps: options.defaultFps || 5
        };

        // Initialize Express and HTTP server
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);

        // Initialize session manager
        this.sessionManager = new SessionManager();

        // Store screenshot intervals for each session
        this.screenshotIntervals = new Map();

        // Configure routes and middleware
        this._configureApp();

        // Configure Socket.IO handlers
        this._configureSocketHandlers();
    }

    /**
     * Configure Express app middleware and routes
     * @private
     */
    _configureApp() {
        // Serve static files
        this.app.use(express.static(this.options.publicDir));

        // Serve main page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(this.options.publicDir, 'index.html'));
        });

        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'ok',
                activeSessions: this.sessionManager.getActiveSessionCount(),
                defaultBrowserType: this.options.defaultBrowserType,
                defaultFps: this.options.defaultFps
            });
        });
    }

    /**
     * Configure Socket.IO event handlers
     * @private
     */
    _configureSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Create a new browser session
            socket.on('start-browser', async (options = {}) => {
                try {
                    const browserType = options.browserType || this.options.defaultBrowserType;
                    const fps = options.fps || this.options.defaultFps;
                    console.log(`Starting ${browserType} browser for ${socket.id} with ${fps} FPS...`);

                    const result = await this.sessionManager.createSession(
                        socket.id,
                        browserType,
                        { 
                            url: options.url,
                            fps: fps
                        }
                    );

                    if (result.success) {
                        socket.emit('browser-started', {
                            status: 'success',
                            browserType,
                            fps
                        });

                        // Start interval screenshot sending
                        this._startScreenshotInterval(socket.id);
                    } else {
                        socket.emit('browser-error', { error: result.error });
                    }
                } catch (error) {
                    console.error('Error starting browser:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            // Update screenshot FPS
            socket.on('set-fps', (data) => {
                try {
                    const fps = parseInt(data.fps, 5) || this.options.defaultFps;
                    const sessionInfo = this.sessionManager.getSessionInfo(socket.id);
                    
                    if (!sessionInfo) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }
                    
                    // Update FPS in session
                    this.sessionManager.updateSession(socket.id, { fps });
                    
                    // Restart interval with new FPS
                    this._stopScreenshotInterval(socket.id);
                    this._startScreenshotInterval(socket.id);
                    
                    socket.emit('fps-updated', { fps });
                    console.log(`Updated FPS to ${fps} for session ${socket.id}`);
                } catch (error) {
                    console.error('Error updating FPS:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            // Navigate to URL
            socket.on('navigate', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    await browser.navigate(data.url);
                    // Screenshot will be sent by the interval
                } catch (error) {
                    console.error('Navigation error:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            // Handle mouse clicks
            socket.on('click', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    // Temporarily pause screenshots during interaction
                    await this._pauseScreenshots(socket.id);
                    
                    // Perform the click
                    await browser.click(data.x, data.y);
                    
                    // Resume screenshots after click
                    this._resumeScreenshots(socket.id);
                } catch (error) {
                    this._resumeScreenshots(socket.id);
                    console.error('Click error:', error);
                    socket.emit('browser-error', { error: `Click error: ${error.message}` });
                }
            });

            // Handle typing
            socket.on('type', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    // Temporarily pause screenshots during interaction
                    await this._pauseScreenshots(socket.id);
                    
                    // Perform the typing
                    await browser.type(data.text);
                    
                    // Resume screenshots after typing
                    this._resumeScreenshots(socket.id);
                } catch (error) {
                    this._resumeScreenshots(socket.id);
                    console.error('Type error:', error);
                    socket.emit('browser-error', { error: `Type error: ${error.message}` });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this._stopScreenshotInterval(socket.id);
                this.sessionManager.closeSession(socket.id).catch(console.error);
            });
        });
    }

    /**
     * Temporarily pause screenshots for a session
     * @param {string} sessionId - Session ID
     * @private
     */
    async _pauseScreenshots(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo) {
            intervalInfo.paused = true;
        }
    }

    /**
     * Resume screenshots for a session
     * @param {string} sessionId - Session ID
     * @private
     */
    _resumeScreenshots(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo) {
            intervalInfo.paused = false;
        }
    }

    /**
     * Start interval-based screenshot sending
     * @param {string} sessionId - Session ID
     * @private
     */
    _startScreenshotInterval(sessionId) {
        // Stop any existing interval
        this._stopScreenshotInterval(sessionId);
        
        // Get the session info to determine FPS
        const sessionInfo = this.sessionManager.getSessionInfo(sessionId);
        if (!sessionInfo) {
            console.error(`Cannot start screenshot interval: Session ${sessionId} not found`);
            return;
        }
        
        // Calculate interval in ms based on per-session FPS
        const fps = sessionInfo.fps || this.options.defaultFps;
        const intervalMs = Math.floor(1000 / fps);
        
        // Create new interval with pause capability
        const intervalInfo = {
            paused: false,
            interval: setInterval(async () => {
                const socket = this.io.sockets.sockets.get(sessionId);
                if (socket && !intervalInfo.paused) {
                    await this._captureAndSendScreenshot(socket);
                } else if (!socket) {
                    this._stopScreenshotInterval(sessionId);
                }
            }, intervalMs)
        };
        
        this.screenshotIntervals.set(sessionId, intervalInfo);
        console.log(`Started screenshot interval for ${sessionId} at ${fps} FPS (${intervalMs}ms)`);
    }

    /**
     * Stop interval-based screenshot sending
     * @param {string} sessionId - Session ID
     * @private
     */
    _stopScreenshotInterval(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo && intervalInfo.interval) {
            clearInterval(intervalInfo.interval);
            this.screenshotIntervals.delete(sessionId);
            console.log(`Stopped screenshot interval for ${sessionId}`);
        }
    }

    /**
     * Helper method to capture screenshot and send to client
     * @param {Socket} socket - Socket.IO socket
     * @private
     */
    async _captureAndSendScreenshot(socket) {
        try {
            const browser = this.sessionManager.getSession(socket.id);
            if (!browser) return;

            const screenshot = await browser.screenshot();

            // Check if screenshot was generated properly
            if (!screenshot) {
                console.warn('Screenshot is undefined or null');
                socket.emit('browser-error', { error: 'Failed to capture screenshot' });
                return;
            }

            socket.emit('screenshot', { image: screenshot.toString('base64') });
        } catch (error) {
            console.error('Screenshot error:', error);
            socket.emit('browser-error', { error: `Screenshot error: ${error.message}` });
        }
    }

    /**
     * Start the server
     * @returns {Promise<void>}
     */
    start() {
        return new Promise((resolve) => {
            this.server.listen(this.options.port, () => {
                console.log(`Boba server running on port ${this.options.port}`);
                resolve();
            });
        });
    }

    /**
     * Stop the server and clean up resources
     * @returns {Promise<void>}
     */
    async stop() {
        // Clear all screenshot intervals
        for (const sessionId of this.screenshotIntervals.keys()) {
            this._stopScreenshotInterval(sessionId);
        }

        // Clean up all browser sessions
        await this.sessionManager.cleanupAllSessions();

        // Close the server
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) {
                    console.error('Error closing server:', err);
                    reject(err);
                } else {
                    console.log('Server stopped');
                    resolve();
                }
            });
        });
    }
}

module.exports = BobaServer;