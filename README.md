# Boba Browser

A modular Node.js backend using Express that can open super lightweight browsers and stream them to clients.

## Features

- Multiple browser engine support using Playwright:
  - **playwright**: Firefox Nightly
  - **chrome**: Chromium (Headless shell)
  - **webkit**: Safari (WebKit)
  - **edge**: Edge (Windows ONLY)
  - **brave**: Brave (Windows ONLY) (MUST be pre-installed on x64)
- Streams browser screenshots to connected clients using Socket.IO
- Real-time interaction with browser (navigation, clicks, keyboard input)
- Clean separation of project with a modular class-based architecture

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

Then access the client interface at http://localhost:3000

## Note

This is a demonstration project and would need additional security measures before production use.