# Electron Desktop App Context

## Completed Tasks
- [x] Initialized Electron package structure.
- [x] Implemented `main.js` with socket client connection and heartbeat pings.
- [x] Securely bridged socket connection events to renderer process via `preload.js`.
- [x] Built the developer console dashboard UI (`index.html`).
- [x] Implemented client-side notification payload handler.
- [x] Integrated TTL client-side checks to discard expired notifications.
- [x] Added delivery acknowledgment (ACK) emission to update server delivery states.
- [x] Integrated local settings JSON store (`settings-store.js`) (Phase 4).
- [x] Configured `powerMonitor` OS suspend/resume listeners to handle host sleep lifecycle (Phase 4).
- [x] Handled real-time admin mute and stop/dismiss socket event propagation (Phase 4).
- [x] Implemented client-side notification queuing system for anti-spam display coordination (Phase 5).

## Pending Tasks
- [ ] Implement settings UI dashboard editor for customizing fonts/sizes.
- [ ] Add multi-monitor layout boundary detection for overlay alignment.

## Current Issues
- Electron binary download stalls locally due to host download speed limitations. Bypassed by setting `ELECTRON_SKIP_BINARY_DOWNLOAD=1` during development, using a headless client (`test-client.js`) to verify the socket logic.

## Architecture Decisions
- **Client-side Expiry Verification**: To avoid clock drift errors, the server filters active notifications first, but the client does a final comparison against local system time to discard anything that expired in transit or during client sleep state.

## Performance Notes
- Keep in-memory logs capped at 100 items in `index.html` to avoid UI rendering lag over long running developer console sessions.

## Integration Notes
- Relies on backend socket contracts for event names (`client:register`, `client:heartbeat`, etc.).
