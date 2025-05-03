/**
 * Boba - A modular Node.js server for streaming lightweight browsers
 * Main entry point
 */
const BobaServer = require('./src/server/BobaServer');
const { parseBrowserTypeFromArgs } = require('./src/utils/helpers');

// Parse command line arguments
const defaultBrowserType = parseBrowserTypeFromArgs();

// Handle shutdown signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Create and start server instance
const server = new BobaServer({
  defaultBrowserType,
  port: process.env.PORT || 3000
});

// Keep track of server instance for clean shutdown
let bobaServerInstance = null;

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log(`Starting Boba server with ${defaultBrowserType} browser engine...`);
    await server.start();
    bobaServerInstance = server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown() {
  console.log('Shutting down server...');
  
  if (bobaServerInstance) {
    try {
      await bobaServerInstance.stop();
      console.log('Server shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
  
  process.exit(0);
}

// Start the server
startServer().catch(console.error);