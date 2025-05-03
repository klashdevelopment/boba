/**
 * SessionManager - Manages browser sessions for connected clients
 */
const BobaPlaywright = require('../browsers/BobaPlaywright');

class SessionManager {
    constructor() {
        this.sessions = {};
    }

    /**
     * Create a new browser session for a client
     * @param {string} sessionId - Unique session identifier (typically socket.id)
     * @param {string} browserType - Type of browser to use ('playwright' | 'chromium' | 'webkit')
     * @param {Object} options - Browser initialization options
     * @returns {Promise<Object>} - Status of browser initialization
     */
    async createSession(sessionId, browserType = 'playwright', options = {}) {
        // Close existing session if one exists
        await this.closeSession(sessionId);

        try {
            let browser;

            // Create the appropriate browser instance
            switch (browserType.toLowerCase()) {
                case 'playwright':
                    browser = new BobaPlaywright();
                    break;
                case 'chromium':
                    browser = new BobaPlaywright('chromium');
                    break;
                case 'webkit':
                    browser = new BobaPlaywright('webkit');
                    break;
                default:
                    throw new Error(`Unknown browser type: ${browserType}`);
            }

            // Initialize the browser
            await browser.initialize(options);

            // Store the session
            this.sessions[sessionId] = {
                browser,
                type: browserType,
                fps: options.fps || 5,
                createdAt: new Date()
            };

            return { success: true, browserType };
        } catch (error) {
            console.error(`Failed to create ${browserType} session:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get an existing browser session
     * @param {string} sessionId - Session identifier
     * @returns {Object|null} - Browser session or null if not found
     */
    getSession(sessionId) {
        const session = this.sessions[sessionId];
        return session ? session.browser : null;
    }

    /**
     * Get an existing session object with all properties
     * @param {string} sessionId - Session identifier
     * @returns {Object|null} - Full session object or null if not found
     */
    getSessionInfo(sessionId) {
        return this.sessions[sessionId] || null;
    }

    /**
     * Update session properties
     * @param {string} sessionId - Session identifier
     * @param {Object} properties - Properties to update
     * @returns {boolean} - True if session was updated, false if not found
     */
    updateSession(sessionId, properties) {
        const session = this.sessions[sessionId];
        
        if (session) {
            Object.assign(session, properties);
            return true;
        }
        
        return false;
    }

    /**
     * Close a browser session and clean up resources
     * @param {string} sessionId - Session identifier
     * @returns {Promise<boolean>} - True if session was closed, false if not found
     */
    async closeSession(sessionId) {
        const session = this.sessions[sessionId];

        if (session) {
            try {
                await session.browser.close();
                delete this.sessions[sessionId];
                return true;
            } catch (error) {
                console.error(`Error closing session ${sessionId}:`, error);
                // Still remove the session from the registry
                delete this.sessions[sessionId];
            }
        }

        return false;
    }

    /**
     * Get active session count
     * @returns {number} - Number of active sessions
     */
    getActiveSessionCount() {
        return Object.keys(this.sessions).length;
    }

    /**
     * Get all active sessions
     * @returns {Object} - Map of session IDs to session objects
     */
    getAllSessions() {
        return this.sessions;
    }

    /**
     * Clean up all sessions
     * @returns {Promise<void>}
     */
    async cleanupAllSessions() {
        const sessionIds = Object.keys(this.sessions);

        for (const sessionId of sessionIds) {
            await this.closeSession(sessionId);
        }
    }
}

module.exports = SessionManager;