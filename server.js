const BobaServer = require('./src/server/BobaServer');
const { parseBrowserTypeFromArgs } = require('./src/utils/helpers');

const defaultBrowserType = parseBrowserTypeFromArgs();

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

const server = new BobaServer({
  defaultBrowserType,
  port: process.env.PORT || 8084
});

let bobaServerInstance = null;
async function startServer() {
  try {
    console.log(`Starting Boba server...`);
    await server.start();
    bobaServerInstance = server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
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
startServer().catch(console.error);