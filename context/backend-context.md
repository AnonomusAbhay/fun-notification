# Backend Service Context

## Completed Tasks
- [x] Monorepo structural setup and TS configuration.
- [x] Initialized workspace types and socket contract.
- [x] Implemented Fastify API with Socket.IO attachment.
- [x] Added connection registration handshake and initial heartbeat system in memory.
- [x] Integrated PostgreSQL database with pool connection and schema auto-creation.
- [x] Configured Redis client with automatic `ioredis-mock` fallback.
- [x] Wired up BullMQ Queue and Worker to store notifications in Postgres and trigger Socket.IO broadcasts.
- [x] Implemented HTTP POST `/api/notifications` route to enqueue notification jobs.
- [x] Implemented DB query-based recovery for active notifications on client registration.
- [x] Supported transparent overlay animation parameters and configurations (Phase 3).
- [x] Connected custom theme configurations and payload parameters (Phase 3).
- [x] Implemented global admin mute, stop, and specific notification dismiss REST API endpoints (Phase 4).

## Pending Tasks
- [ ] Implement Redis pub/sub socket coordination for scaling out across multiple servers (Phase 4 Hardening).
- [ ] Add JWT authentication to admin routes.

## Current Issues
- Local environment has PostgreSQL 18 service running, but Redis is not installed. Resolved by writing a seamless factory that spins up an in-memory Redis/BullMQ mock (`ioredis-mock`) in dev mode, preventing setup blockages.

## Architecture Decisions
- **BullMQ + Redis Pub/Sub**: Selected for the messaging pipeline to separate API parsing from realtime connection broadcasting.
- **PostgreSQL Persistence**: Storing notification logs to manage client recovery syncing.
- **Connection Recovery**: Syncing happens by querying the database for undelivered notifications where `expires_at > NOW()`.

## Performance Notes
- Database queries use index mapping `(recipient_id, expires_at)` to keep lookup times fast (<10ms).

## Integration Notes
- Shares socket contracts dynamically with frontend packages under `@fun-notification/socket-contracts`.
