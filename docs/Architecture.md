# Architecture

```mermaid
graph TD
  Client[Web Client] -->|HTTP| API[Express API]
  API --> DB[(PostgreSQL)]
  API --> Storage[(File Storage)]
  API --> FFmpeg[FFmpeg CLI]
```
