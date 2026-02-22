# Plan CI/CD (futur)

Objectif : déployer automatiquement **sans casser le design**.

## Étapes recommandées
1. **Tests**
   - `npm test` (frontend)
   - `npm test` (backend)
2. **Build**
   - `docker build` backend
   - `docker build` frontend
3. **Push**
   - Pousser images vers un registry (Docker Hub ou GHCR)
4. **Deploy**
   - `docker compose -f docker-compose.vps.yml pull`
   - `docker compose -f docker-compose.vps.yml up -d`
5. **Validation**
   - `curl -i https://api.appcoran.com/health`
   - Smoke test web (chargement page)

## Exemple GitHub Actions (pseudo)
```yaml
name: deploy
on: [push]
jobs:
  build:
    steps:
      - checkout
      - docker build
      - docker push
  deploy:
    steps:
      - ssh vps
      - docker compose pull
      - docker compose up -d
```
