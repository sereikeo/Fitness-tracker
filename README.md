# Fitness Tracker

Personal fitness web app for logging workouts and tracking progress.

**Stack:** React · FastAPI · Caddy · Docker Compose · GitHub Actions · Cloudflare Tunnel

**Live:** https://fitness.sereikeo.dev (Cloudflare Access — GitHub OAuth required)

---

## Architecture
Browser → Cloudflare Access (GitHub OAuth) → Cloudflare Tunnel → Caddy (:8181) → React frontend
→ FastAPI → SQLite


All database access is server-side via the FastAPI layer — the frontend never touches the database directly.

| Component | Technology |
|---|---|
| Frontend | React (Vite) |
| API | FastAPI (Python 3.11) |
| Proxy | Caddy (port 8181) |
| Database | SQLite via SQLAlchemy Core |
| CI/CD | GitHub Actions (self-hosted) |
| Containers | Docker Compose |
| Auth / Access | Cloudflare Access (GitHub OAuth) |

---

## Local Development

**Prerequisites:** Docker, Docker Compose

```bash
git clone https://github.com/sereikeo/Fitness-tracker.git
cd fitness-tracker
cp .env.example .env
docker compose up
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| FastAPI (Swagger UI) | http://localhost:8000/docs |

> **Note:** Python 3.11 is required — do not upgrade to 3.12+.

---

## Deployment

Deployment is automated via GitHub Actions on every push to `master`.
push to master → GitHub Actions (self-hosted runner on Synology NAS) → docker compose pull && docker compose up -d


### Synology NAS — Docker Command Differences

The NAS runs Docker v1. Use these commands over SSH, not standard Compose v2:

| Standard | Synology equivalent |
|---|---|
| `docker compose up -d` | `sudo docker-compose up` (foreground — keep SSH session open) |
| `docker compose build` | `sudo docker-compose build --no-cache <service>` |
| `docker compose logs --tail=50` | `sudo docker logs <container-name> -n 50` |
| `docker compose exec` | `sudo docker exec <container-name>` |

---

## Repo Structure
fitness-tracker/
├── frontend/ # React (Vite) app
├── api/ # FastAPI app
├── proxy/ # Caddy config
├── .github/
│ └── workflows/
│ └── deploy.yml
├── docker-compose.yml
├── .env.example
└── README.md


---

## Constraints

- Single user — no multi-tenancy in v1
- SQLite is the sole data store — local file mounted into the Docker container
- SQLAlchemy Core only — do not use the ORM
- Frontend is presentation only — all business logic lives in FastAPI
- All weights in kg