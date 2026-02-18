# 📘 LIVRABLES COMPLETS — PROJET APPLICATION WEB DE LECTURES CORANIQUES
## 1️⃣ 📊 MODÉLISATION UML COMPLÈTE

### 1.1 Diagramme de Cas d’Utilisation

@startuml
left to right direction

actor Imam
actor Fidèle

rectangle "Application Web Lectures Coraniques" {

  Imam --> (S'authentifier)
  Imam --> (Enregistrer audio)
  Imam --> (Uploader audio)
  Imam --> (Ajouter Basmala)
  Imam --> (Publier lecture)
  Imam --> (Modifier lecture)
  Imam --> (Supprimer lecture)
  Imam --> (Consulter statistiques)

  Fidèle --> (Consulter liste lectures)
  Fidèle --> (Ecouter audio)
  Fidèle --> (Télécharger audio)
  Fidèle --> (Rechercher par sourate)
}

@enduml

**Interprétation professionnelle**

- Imam = Product Owner + Admin principal
- Fidèle = Utilisateur public
- Le cas d’usage "Ajouter Basmala" est une extension conditionnelle
- Les statistiques sont un cas métier stratégique (engagement)

### 1.2 Diagramme de Classes

@startuml

class User {
  id: UUID
  email: string
  password_hash: string
  role: enum
  created_at: datetime
}

class Audio {
  id: UUID
  title: string
  sourate: string
  verset_start: int
  verset_end: int
  description: text
  file_url: string
  basmala_added: boolean
  created_at: datetime
  updated_at: datetime
}

class AudioStats {
  id: UUID
  audio_id: UUID
  listens_count: int
  downloads_count: int
}

User "1" -- "0..*" Audio
Audio "1" -- "1" AudioStats

@enduml

**Décisions d’architecture**

- UUID pour scalabilité
- Découplage Audio / AudioStats pour performance
- basmala_added = traçabilité métier

### 1.3 Diagramme de Séquence — Ajout Basmala

@startuml

Imam -> Frontend : Upload audio + cocher "Ajouter Basmala"
Frontend -> Backend : POST /audios
Backend -> Storage : Upload fichier original
Backend -> AudioProcessor : Merge basmala + audio (FFmpeg)
AudioProcessor -> Storage : Upload fichier final
Backend -> DB : Save metadata
Backend -> Frontend : Confirmation

@enduml


## 2️⃣ 🧱 ARCHITECTURE TECHNIQUE DÉTAILLÉE (PRÊTE POUR CODEX)
### 2.1 Stack recommandée
| Couche           | Technologie             | Justification     |
| ---------------- | ----------------------- | ----------------- |
| Frontend         | Next.js 14              | SEO + PWA         |
| Backend          | Node.js + Express       | API REST scalable |
| DB               | PostgreSQL              | Robustesse        |
| Storage          | AWS S3                  | Stockage audio    |
| Audio processing | FFmpeg                  | Fusion audio      |
| Auth             | JWT + bcrypt            | Sécurité          |
| DevOps           | Docker + GitHub Actions | CI/CD             |

### 2.2 Architecture globale

[Client]
   |
   v
[Next.js Frontend]
   |
   v
[Express API]
   |
   |-- PostgreSQL
   |-- S3 Storage
   |-- FFmpeg Processor

### 2.3 Exemple API — Upload Audio (Express)
``` router.post("/audios", authenticate, upload.single("file"), async (req, res) => {
  const { title, sourate, addBasmala } = req.body;
  const filePath = req.file.path;

  let finalFile = filePath;

  if (addBasmala === "true") {
    finalFile = await mergeWithBasmala(filePath);
  }

  const audio = await Audio.create({
    title,
    sourate,
    file_url: finalFile,
    basmala_added: addBasmala === "true"
  });

  res.status(201).json(audio);
});
```
### 2.4 Script FFmpeg — Fusion Basmala
```
ffmpeg -i basmala.mp3 -i lecture.mp3 \
-filter_complex "[0:0][1:0]concat=n=2:v=0:a=1[out]" \
-map "[out]" output.mp3

```

## 3️⃣ 🚀 PROMPTS AVANCÉS POUR CODEX
### 3.1 Prompt Backend API
```
You are a senior Node.js backend engineer.
Generate a production-ready Express.js API for managing audio uploads.
Constraints:
- Use PostgreSQL with Prisma ORM
- Implement JWT authentication
- Include file upload using Multer
- Add optional basmala merge using FFmpeg
- Follow clean architecture principles
- Provide folder structure
- Include validation using Zod

```

### 3.2 Prompt Traitement Audio
```
Generate a Node.js service that merges two mp3 files using fluent-ffmpeg.
Requirements:
- Handle async/await properly
- Return output path
- Handle errors
- Log processing time

```

### 3.3 Prompt Frontend
```
Generate a Next.js 14 application with:
- Audio upload form
- Checkbox "Add Basmala"
- Audio streaming player
- Responsive design with Tailwind
- API integration

```

## 🎯 CONCLUSION STRATÉGIQUE

Ce projet est :
- Techniquement simple
- Spirituellement fort
- Évolutif vers mobile
- Idéal pour architecture cloud moderne

Il est parfaitement pilotable avec :
- CODEX pour génération backend
- Claude pour validation logique
- Windsurf pour refactoring frontend