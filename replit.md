# RDX Bot - Replit Configuration

## Overview

RDX Bot is a Facebook Messenger bot (v0.7) built with Node.js. It automates group management, provides an economy/currency system, social features (friendships, relationships), AI-powered assistance, and Islamic content posting. The bot communicates through Facebook Messenger using a custom Facebook Chat API (`RDX-FCA`, a fork of `isardar-fca`). It's authored by "SARDAR RDX" and targets Urdu/Pakistani user communities.

The bot runs via a process controller (`index.js`) that spawns the main bot script (`RDX.js`) with automatic restart on crash. The bot authenticates to Facebook using cookie-based session state (`appstate.json`) and listens for incoming messages, processing commands and events.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Entry Points & Process Management
- **`index.js`** — Process controller that spawns `RDX.js` as a child process. Handles crash recovery with automatic restarts (up to 10 restarts per minute window). This is the `npm start` entry point.
- **`RDX.js`** — Main bot logic. Logs into Facebook via `RDX-FCA`, loads commands/events, sets up cron jobs for auto-restart and Islamic posting, and starts listening for messages.

### Facebook Chat API (`RDX-FCA/`)
- A bundled local package (referenced as `file:./RDX-FCA` in `package.json`). This is a customized Facebook Chat API that handles:
  - Cookie-based authentication via `appstate.json`
  - Facebook token refresh (`fb_dtsg`) stored in `RDX-FCA.json` and `RDX-FCA/RDX-FCA.json`
  - Real-time message listening via MQTT/WebSocket
  - Sending messages, managing groups, user info retrieval
  - Built-in user agent rotation and region bypass for anti-detection
- Contains SHA-256 hash-based authorization checks for certain privileged user IDs

### Command System (`RDX/commands/`)
- Commands are individual `.js` files with a standard module structure:
  - `config` object: name, aliases, description, usage, category, adminOnly, prefix requirement
  - `run()` async function: receives `{ api, event, args, send, Users, Threads, Currencies, config, client }`
- Commands are loaded dynamically at startup and can be hot-reloaded via the `restart` command
- Categories include: Economy, Admin, Group, Fun, Media, Friend, Utility, Profile
- A `NEW COMMANDS` subdirectory is checked during reload for newly added commands

### Event System (`RDX/events/`)
- Event handlers for group join/leave, reactions, notifications, etc.
- Loaded similarly to commands via `handleRefresh`

### Message Processing Pipeline (`Data/system/`)
- **`listen.js`** — Main message listener that routes events to appropriate handlers
- **`handle/handleCommand.js`** — Command parsing, prefix checking, cooldown enforcement
- **`handle/handleEvent.js`** — Non-command event processing
- **`handle/handleReaction.js`** — Message reaction handling
- **`handle/handleReply.js`** — Reply-based interaction handling
- **`handle/handleNotification.js`** — Facebook notification processing
- **`handle/handleCreateDatabase.js`** — Auto-creates user/thread database entries
- **`handle/handleAutoDetect.js`** — Auto-detection features
- **`handle/handleRefresh.js`** — Hot-reload functionality for commands/events

### Data Controllers (`Data/system/controllers/`)
- **`UsersController`** — User management (names, bans, data storage)
- **`ThreadsController`** — Group/thread settings (approval, anti-join, anti-out, per-group config)
- **`CurrenciesController`** — Economy system (wallet balance, bank balance, deposits, withdrawals)

### Database
- **`better-sqlite3`** — SQLite database for persistent storage
- Located in `Data/system/database/`
- Tables include: user data, thread settings, currency/bank system, ban lists
- The `_economy.js` helper handles cross-wallet/bank charging logic

### Configuration
- **`config.json`** — Main bot configuration: bot name, prefix (`.`), admin UIDs, cooldown, language, auto-restart interval, ignored users, disabled commands
- **`Data/config/islamic_messages.json`** — Islamic post content for scheduled posting
- **`Data/config/config.json`** — Internal display/ad config
- Thread-specific settings stored in database (antijoin, antiout, approval status)

### Utility Layer (`Data/utility/`)
- **`logs.js`** — Colored console logging with file-based log persistence (daily log files in `Data/system/database/botdata/logs/`)
- **`send.js`** — Message sending wrapper with retry logic, membership checks, and transient error handling
- **`utils.js`** — Common utilities (time formatting, number formatting, random helpers)

### Key Design Decisions

1. **Local FCA package instead of npm**: The Facebook Chat API is bundled locally (`file:./RDX-FCA`) rather than installed from npm. This allows custom modifications for anti-detection, token refresh, and authorization without depending on upstream updates.

2. **Process supervisor pattern**: `index.js` acts as a supervisor that restarts `RDX.js` on crashes, providing resilience without external process managers like PM2.

3. **SQLite over cloud databases**: Uses `better-sqlite3` for simplicity and zero-config. All data is local. This means no external database setup needed but data doesn't persist across Replit deployments unless the filesystem is preserved.

4. **Hot-reload commands**: The `restart` command clears Node's require cache and reloads all command files without restarting the process, enabling live updates.

5. **Timezone**: All timestamps use `Asia/Karachi` (Pakistan Standard Time).

6. **Auto-restart cron**: Bot auto-restarts every 120 minutes (configurable) to maintain Facebook session stability.

### Important Notes for Development
- The `appstate.json` contains Facebook session cookies — this is the authentication mechanism. If it expires, the bot cannot log in.
- `RDX-FCA.json` files contain Facebook DTSG tokens that refresh periodically.
- Many commands use `request` (deprecated) for HTTP calls — some use `axios`. Be consistent with `axios` for new code.
- Cache files for image commands are stored in `RDX/commands/cache/` and cleaned up after sending.
- The bot has admin-level permissions controlled by UIDs in `config.json`'s `ADMINBOT` array.
- Some commands have hidden owner checks using SHA-256 hashed UIDs.

## External Dependencies

### Core Dependencies
- **`better-sqlite3`** — Local SQLite database engine
- **`axios`** — HTTP client for API calls
- **`express`** — Web server (likely for keep-alive or webhook endpoints)
- **`fs-extra`** — Enhanced file system operations
- **`moment-timezone`** — Date/time handling with timezone support
- **`node-cron`** — Scheduled task execution
- **`chalk`** — Terminal color output
- **`canvas`** — Image generation/manipulation
- **`jimp`** — Image processing (used in friendship card generation)
- **`node-fetch`** — HTTP fetch API
- **`yt-search`** — YouTube search functionality
- **`string-similarity`** — Fuzzy string matching (likely for command suggestions)
- **`pastebin-api`** — Pastebin integration

### Facebook Chat API Dependencies (RDX-FCA)
- **`cheerio`** — HTML parsing for Facebook page scraping
- **`request`** — HTTP requests (legacy, used within FCA)
- **`mqtt`** — MQTT protocol for real-time Facebook message listening
- **`websocket-stream`** — WebSocket support for Facebook connection
- **`gradient-string`** — Terminal gradient text styling
- **`https-proxy-agent`** — Proxy support for Facebook connections

### External Services
- **Facebook Messenger** — Primary platform; bot logs in via cookie session and communicates through Messenger
- **Facebook Graph API** — Used for profile pictures, user info
- **ibb.co** — Image hosting service for food/fun command images
- **Groq API / Cerebras API** — AI inference for the RDXAI assistant feature (mentioned in docs)
- **Pastebin** — For sharing large text outputs