# Prompt CODEX — Backend (explication simple)

## Pourquoi ce fichier ?
Ce fichier contient un **prompt prêt à l’emploi** pour générer ou régénérer le backend avec une IA.
Il sert de “brief technique” complet.

## Comment l’utiliser (pas à pas)
1) Copier le prompt ci‑dessous.
2) Le coller dans l’outil IA.
3) Demander la génération complète du backend.

## Résultat attendu
Un backend complet, sécurisé, avec API, audio, base PostgreSQL et documentation.

---

## ✅ Prompt prêt à copier
```markdown
You are a senior backend engineer (Node.js, Express) with 10+ years of experience.
Generate a production-ready backend for a Quranic recitation app.

Requirements:
- Node.js + Express (ESM)
- PostgreSQL (native SQL, no ORM)
- JWT auth + bcrypt
- Zod validation
- Multer upload
- FFmpeg CLI for basmala merge
- Audio streaming with HTTP range
- Swagger docs
- Dockerfile + docker-compose
- Clear folder structure
- Tests (basic unit + integration)

Folder structure:
backend-appcoran/
  src/
    config/
    modules/
    middlewares/
    utils/
    docs/
  sql/
  tests/
  Dockerfile
  docker-compose.yml
  README.md
  .env.example

Must include:
- Auth routes
- Audio CRUD
- Public streaming/download
- Profile and dashboard endpoints
- Logging with Pino
- Security (Helmet, CORS, rate limits)

Provide full code, not just summary.
```
