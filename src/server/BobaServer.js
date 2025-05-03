const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const SessionManager = require('./SessionManager');

class BobaServer {
    constructor(options = {}) {
        this.options = {
            port: options.port || process.env.PORT || 3000,
            defaultBrowserType: options.defaultBrowserType || 'playwright',
            publicDir: options.publicDir || path.join(process.cwd(), 'public'),
            defaultFps: options.defaultFps || 5
        };

        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.sessionManager = new SessionManager();
        this.screenshotIntervals = new Map();

        this._configureApp();
        this._configureSocketHandlers();
    }

    _configureApp() {
        this.app.use(express.static(this.options.publicDir));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(this.options.publicDir, 'index.html'));
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'ok',
                activeSessions: this.sessionManager.getActiveSessionCount(),
                defaultBrowserType: this.options.defaultBrowserType,
                defaultFps: this.options.defaultFps
            });
        });
    }

    _configureSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

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
                        this._startScreenshotInterval(socket.id);
                    } else {
                        socket.emit('browser-error', { error: result.error });
                    }
                } catch (error) {
                    console.error('Error starting browser:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            socket.on('set-fps', (data) => {
                try {
                    const fps = parseInt(data.fps, 5) || this.options.defaultFps;
                    const sessionInfo = this.sessionManager.getSessionInfo(socket.id);
                    
                    if (!sessionInfo) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }
                    
                    this.sessionManager.updateSession(socket.id, { fps });
                    this._stopScreenshotInterval(socket.id);
                    this._startScreenshotInterval(socket.id);
                    
                    socket.emit('fps-updated', { fps });
                    console.log(`Updated FPS to ${fps} for session ${socket.id}`);
                } catch (error) {
                    console.error('Error updating FPS:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            socket.on('navigate', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    await browser.navigate(data.url);
                } catch (error) {
                    console.error('Navigation error:', error);
                    socket.emit('browser-error', { error: error.message });
                }
            });

            socket.on('click', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    await this._pauseScreenshots(socket.id);
                    await browser.click(data.x, data.y);
                    this._resumeScreenshots(socket.id);
                } catch (error) {
                    this._resumeScreenshots(socket.id);
                    console.error('Click error:', error);
                    socket.emit('browser-error', { error: `Click error: ${error.message}` });
                }
            });

            socket.on('type', async (data) => {
                try {
                    const browser = this.sessionManager.getSession(socket.id);
                    if (!browser) {
                        socket.emit('browser-error', { error: 'No active browser session' });
                        return;
                    }

                    await this._pauseScreenshots(socket.id);
                    await browser.type(data.text);
                    this._resumeScreenshots(socket.id);
                } catch (error) {
                    this._resumeScreenshots(socket.id);
                    console.error('Type error:', error);
                    socket.emit('browser-error', { error: `Type error: ${error.message}` });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this._stopScreenshotInterval(socket.id);
                this.sessionManager.closeSession(socket.id).catch(console.error);
            });
        });
    }

    async _pauseScreenshots(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo) {
            intervalInfo.paused = true;
        }
    }

    _resumeScreenshots(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo) {
            intervalInfo.paused = false;
        }
    }

    _startScreenshotInterval(sessionId) {
        this._stopScreenshotInterval(sessionId);
        
        const sessionInfo = this.sessionManager.getSessionInfo(sessionId);
        if (!sessionInfo) {
            console.error(`Cannot start screenshot interval: Session ${sessionId} not found`);
            return;
        }
        
        const fps = sessionInfo.fps || this.options.defaultFps;
        const intervalMs = Math.floor(1000 / fps);
        
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

    _stopScreenshotInterval(sessionId) {
        const intervalInfo = this.screenshotIntervals.get(sessionId);
        if (intervalInfo && intervalInfo.interval) {
            clearInterval(intervalInfo.interval);
            this.screenshotIntervals.delete(sessionId);
            console.log(`Stopped screenshot interval for ${sessionId}`);
        }
    }

    async _captureAndSendScreenshot(socket) {
        try {
            const browser = this.sessionManager.getSession(socket.id);
            if (!browser) return;

            const screenshot = await browser.screenshot();

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

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.options.port, () => {
                console.log(`Boba server running on port ${this.options.port}`);
                resolve();
            });
        });
    }

    async stop() {
        for (const sessionId of this.screenshotIntervals.keys()) {
            this._stopScreenshotInterval(sessionId);
        }

        await this.sessionManager.cleanupAllSessions();

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
