```markdown
# 🎯 OPTIMIZED BACKEND DEVELOPMENT PROMPT — QURANIC RECITATION APPLICATION

---

## 🧠 GENERAL CONTEXT

You are a **Senior Backend Engineer (Node.js, 10+ years experience)** and **AI specialist** with expertise in:

- Prompt engineering
- AI orchestration (Vibe coding)
- Clean Architecture
- Robust, secure REST APIs
- Native PostgreSQL (no ORM)
- Audio processing with FFmpeg (CLI, actively maintained)
- Advanced security (JWT, strict validation, global error handling)
- Maintainable, scalable, well-documented code

Your task: **Generate a complete, production-grade backend** for a web application publishing Quranic recitations.

---

## 🎯 FUNCTIONAL OBJECTIVES

Build a REST API supporting:

1. Secure Imam (admin) authentication
2. Audio upload
3. Optional automatic Basmala insertion
4. Audio merging via FFmpeg CLI
5. Efficient audio streaming
6. Audio download
7. Usage statistics (listens & downloads)
8. Full CRUD for recitations
9. Comprehensive project documentation

---

## ⚙️ TECHNICAL REQUIREMENTS

### Mandatory Stack

- Node.js 20+
- Express.js (actively maintained)
- PostgreSQL (native SQL via `pg`)
- JWT (`jsonwebtoken`)
- bcrypt
- Zod (validation)
- Multer (file upload)
- FFmpeg CLI (via `child_process`)
- dotenv
- Helmet
- CORS
- Pino (modern logger)
- Jest (testing)
- ESLint + Prettier
- Swagger (API documentation)
- Docker

**Prohibited:**
- ORMs (Prisma, Sequelize, TypeORM)
- fluent-ffmpeg (deprecated)
- Unmaintained libraries

---

## 🏗 ENFORCED ARCHITECTURE

Adhere to **Clean Architecture** with strict separation of concerns.

```
backend/
│
├── src/
│ ├── config/
│ │ ├── database.js
│ │ ├── env.js
│ │ └── logger.js
│ │
│ ├── modules/
│ │ ├── auth/
│ │ │ ├── auth.controller.js
│ │ │ ├── auth.service.js
│ │ │ ├── auth.routes.js
│ │ │ └── auth.repository.js
│ │ │
│ │ ├── audio/
│ │ │ ├── audio.controller.js
│ │ │ ├── audio.service.js
│ │ │ ├── audio.routes.js
│ │ │ ├── audio.repository.js
│ │ │ └── audio.processor.js
│ │
│ ├── middlewares/
│ │ ├── auth.middleware.js
│ │ ├── error.middleware.js
│ │ └── validation.middleware.js
│ │
│ ├── utils/
│ │ ├── ffmpeg.util.js
│ │ └── response.util.js
│ │
│ ├── docs/
│ │ └── swagger.js
│ │
│ ├── app.js
│ └── server.js
│
├── tests/
│
├── sql/
│ └── schema.sql
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── README.md
└── .env.example
```

---

## 🗄 DATABASE DESIGN (NATIVE SQL)

Generate `sql/schema.sql` with:

### Table: users

- `id` UUID PRIMARY KEY
- `email` VARCHAR UNIQUE NOT NULL
- `password_hash` VARCHAR NOT NULL
- `role` VARCHAR (admin only for now)
- `created_at` TIMESTAMP

### Table: audios

- `id` UUID PRIMARY KEY
- `title` VARCHAR
- `sourate` VARCHAR
- `verset_start` INT
- `verset_end` INT
- `description` TEXT
- `file_path` VARCHAR
- `basmala_added` BOOLEAN
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### Table: audio_stats

- `id` UUID PRIMARY KEY
- `audio_id` UUID REFERENCES audios(id) ON DELETE CASCADE
- `listens_count` INT DEFAULT 0
- `downloads_count` INT DEFAULT 0

**Indexes:**
- On `sourate`
- On `created_at`

---

## 🔊 AUDIO PROCESSING — BASMALA INSERTION

Implement via FFmpeg CLI:

```js
import { spawn } from "child_process";
// Example command:
ffmpeg -i basmala.mp3 -i lecture.mp3 -filter_complex concat=n=2:v=0:a=1 output.mp3
```

**Requirements:**
- Robust error handling
- Logging
- Security timeout
- Cleanup of temporary files
- FFmpeg existence check at startup

---

## 🔐 SECURITY REQUIREMENTS

- Helmet
- Configurable CORS
- Rate limiting
- JWT (1h expiry)
- Optional refresh token
- bcrypt (cost factor 12)
- Strict Zod validation for all routes
- Global error handler middleware

---

## 📈 PERFORMANCE REQUIREMENTS

- Streaming via `res.sendFile` with HTTP range headers (206 support)
- Non-blocking event loop
- Pino logging
- PostgreSQL connection pooling

---

## 🧪 TESTING REQUIREMENTS

- Unit tests for services
- Authentication tests
- Database mocking
- Minimum 90% code coverage

---

## 📘 DOCUMENTATION REQUIREMENTS

**README.md** must include:

- Project description
- Local installation guide
- Environment variables
- Docker instructions
- Architecture overview
- Database schema
- Available commands
- Implemented security
- Deployment guide

**Swagger:**

- Document all routes
- Include request examples
- Error codes

---

## 🧾 API ROUTES TO IMPLEMENT

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`

### Audio

- `POST /api/audios`
- `GET /api/audios`
- `GET /api/audios/:id`
- `PUT /api/audios/:id`
- `DELETE /api/audios/:id`
- `GET /api/audios/:id/stream`
- `GET /api/audios/:id/download`

---

## 🧩 CODE QUALITY REQUIREMENTS

- ES Modules syntax
- Use `async/await` exclusively
- Clear, educational comments
- JSDoc for critical functions
- Centralized error management
- No duplicated code (DRY)
- SOLID principles
- Scalable architecture

---

## 🐳 DOCKER REQUIREMENTS

- Optimized multi-stage Dockerfile
- `docker-compose.yml` with:
    - backend service
    - postgres service
    - persistent volume

---

## 🚀 EXPECTED QUALITY

Generated code must be:

- Production-ready
- Scalable
- Secure
- Maintainable
- Testable
- Readable
- Modern
- No approximations
- No deprecated dependencies
- No obvious security flaws
- No bad practices

---

## 🎯 DELIVERABLES

Generate:

- All project files
- Complete codebase
- SQL schema
- Full README
- Swagger documentation
- Tests
- Docker configuration
- NPM scripts

**Do not summarize.  
Do not simplify.  
Provide the full implementation.**

END OF PROMPT
```