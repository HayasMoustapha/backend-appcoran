# backend-appcoran

Backend API for a Quranic recitation web application. The Imam can upload recordings, optionally add the basmala, publish, and allow users to stream or download recitations.

## Features

- Admin authentication (JWT + optional refresh token)
- Audio upload (Multer)
- Optional basmala insertion (FFmpeg CLI)
- Audio streaming with HTTP range
- Audio download
- Usage statistics (listens & downloads)
- PostgreSQL (native SQL)
- Swagger API docs
- Automatic DB create + migrations + seed

## Architecture Overview

```
backend-appcoran/
├── src/
│   ├── config/           # env, database, logger, migrations
│   ├── modules/          # auth, audio (controller/service/repository)
│   ├── middlewares/      # auth, validation, errors
│   ├── utils/            # ffmpeg, response helpers
│   ├── docs/             # swagger
│   ├── app.js
│   └── server.js
├── sql/
│   ├── migrations/
│   └── schema.sql
├── tests/
├── postman/
└── uploads/
```

## Database Schema

- `users(id, email, password_hash, role, created_at)`
- `audios(id, title, sourate, verset_start, verset_end, description, file_path, basmala_added, created_at, updated_at)`
- `audio_stats(id, audio_id, listens_count, downloads_count)`

## Setup (Local)

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. Run server (DB auto-create + migrate + seed)

```bash
npm run dev
```

## Docker

```bash
docker compose up --build
```

## Environment Variables

- `DATABASE_URL` PostgreSQL connection string
- `DB_ADMIN_DATABASE` admin database used to create target DB (default: `postgres`)
- `JWT_SECRET` secret for JWT signing
- `JWT_EXPIRES_IN` token expiration (e.g., `1h`)
- `REFRESH_TOKEN_SECRET` optional refresh token signing secret
- `CORS_ORIGIN` allowed origin
- `UPLOAD_DIR` directory for uploaded audio
- `BASMALA_PATH` path to basmala audio file
- `MAX_UPLOAD_MB` max upload size
- `RATE_LIMIT_WINDOW_MS` rate limiter window
- `RATE_LIMIT_MAX` max requests per window
- `AUTO_MIGRATE` run migrations on startup
- `AUTO_SEED` seed admin on startup
- `ADMIN_EMAIL` admin email for seed
- `ADMIN_PASSWORD` admin password for seed
- `KEEP_ORIGINAL_AUDIO` keep original audio when basmala is added

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/audios`
- `GET /api/audios`
- `GET /api/audios/:id`
- `PUT /api/audios/:id`
- `DELETE /api/audios/:id`
- `GET /api/audios/:id/stream`
- `GET /api/audios/:id/download`

## Swagger

- `GET /api/docs`

## Security

- Helmet
- Rate limiting
- JWT authentication
- Zod validation

## Postman / Newman

Collections and environments are in `postman/`.

```bash
npx newman run postman/collections/auth.collection.json -e postman/environments/local.json
npx newman run postman/collections/audio.collection.json -e postman/environments/local.json
```

## Available Commands

- `npm run dev`
- `npm run start`
- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run test:coverage`

## Deployment Guide

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Provide a persistent volume for `uploads/`.
3. Provide `BASMALA_PATH` to a valid MP3.
4. Set `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to strong random values.
5. Configure `CORS_ORIGIN` for your frontend domain.
6. Run with Docker or a process manager (systemd/PM2).
