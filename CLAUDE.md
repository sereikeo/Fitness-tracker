# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start all services for local development
docker compose up

# Access React frontend
http://localhost:3000

# Access FastAPI Swagger UI
http://localhost:8000/docs

# Build Docker images
docker compose build

# Run specific service (e.g., just the API)
docker compose up api

# Execute a one-off command in a service
docker compose run --rm frontend npm test
```

## High-Level Architecture

- **Frontend**: React (Vite) app — presentation only, no business logic, no direct database calls
- **Backend**: FastAPI (Python 3.11) — all business logic, all database access is server-side
- **Database**: SQLite via SQLAlchemy Core (local file on NAS, mounted into Docker container)
- **Routing**: Caddy reverse proxy — HTTPS termination, CORS headers, rate limiting
- **Deployment**: Docker Compose + GitHub Actions (self-hosted runner on Synology NAS)
- **Auth**: Cloudflare Access (GitHub OAuth / Zero Trust)

### Component Flow
Browser → Cloudflare Access (GitHub OAuth) → Cloudflare Tunnel → Caddy → [React frontend | FastAPI] → SQLite

## Repo Structure
fitness-tracker/
├── frontend/ # React (Vite) app
├── api/ # FastAPI app
├── proxy/ # Caddy config
├── .github/workflows/ # CI/CD configuration
├── docker-compose.yml
└── .env.example


## Key Constraints

- Python 3.11 required — do NOT use 3.12 or higher
- SQLite is the sole data store — do NOT use Notion API for data, it is project management only
- SQLAlchemy Core only — do NOT use the ORM
- Frontend is presentation only — all business logic lives in FastAPI
- Single-user architecture (no multi-tenancy)
- Weights in kg only — never lbs
- Hosting is self-hosted on Synology NAS via Docker Compose