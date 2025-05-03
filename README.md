# Boba Browser

A modular Node.js backend using Express that can open super lightweight browsers and stream them to clients.

## Features

- Class-based modular architecture
- Multiple browser engine support:
  - **BobaPlaywright**: Firefox via Playwright (lightweight alternative to Chromium/Puppeteer)
- Streams browser screenshots to connected clients via Socket.IO
- Real-time interaction with browser (navigation, clicks, keyboard input)
- Clean separation of concerns with class-based architecture
- Performance metrics tracking

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

Start the server with your preferred browser engine:

```bash
# Start with Firefox (default)
npm start

# Explicitly specify Firefox
npm run start:playwright
```

Or use command line arguments:

```bash
# Start with Firefox
node server.js --browser=playwright
```

Then access the client interface at http://localhost:3000

## Project Structure

```
boba/
├── server.js                     # Main server file
├── src/
│   ├── browsers/
│   │   ├── BobaBrowser.js        # Abstract base browser class
│   │   ├── BobaPlaywright.js     # Playwright implementation
│   ├── server/
│   │   ├── BobaServer.js         # Server class
│   │   └── SessionManager.js     # Browser session management
│   └── utils/
│       └── helpers.js            # Utility functions
└── public/
    └── index.html                # Client interface
```

## Architecture

### Browser Classes

- **BobaBrowser**: Abstract base class defining the interface all browser implementations must follow
- **BobaPlaywright**: Implementation using Playwright with Firefox

### Server Classes

- **BobaServer**: Main Express server handling HTTP and WebSocket connections
- **SessionManager**: Manages browser sessions for connected clients

## Browser Options

### BobaPlaywright (Firefox)

- More complete browsing experience with visual fidelity
- Full interaction capabilities
- Proper rendering of modern websites
- Moderate resource usage

## Client Interface

The client interface provides:
- Browser engine selection
- URL navigation
- Click and keyboard interaction
- Performance metrics
- Clean, responsive design

## Future Improvements

- Add more browser engine options (e.g., WebKit)
- Implement more interaction capabilities
- Add authentication and security features
- Add support for browser extensions

## Note

This is a demonstration project and would need additional security measures before production use.