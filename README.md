# Fitness Tracker

Personal fitness web app for logging workouts and tracking progress. Uses [Notion](https://notion.so) as the database backend — allowing manual data entry while the UI is being built.

**Stack:** React · FastAPI · Caddy · Docker Compose · GitHub Actions · Cloudflare Tunnel

***

## Architecture

```
Browser → Cloudflare Tunnel → Caddy → React frontend
                                     → FastAPI → Notion API
```

All Notion API calls are server-side via the FastAPI layer — the frontend never touches the Notion API directly.

| Component | Technology |
|---|---|
| Frontend | React (Vite) |
| API | FastAPI (Python 3.11) |
| Proxy | Caddy |
| Database | Notion API |
| CI/CD | GitHub Actions (self-hosted) |
| Containers | Docker Compose |

***

## Local Development

**Prerequisites:** Docker, Docker Compose

```bash
git clone https://github.com/<your-username>/fitness-tracker.git
cd fitness-tracker
cp .env.example .env   # fill in your NOTION_API_KEY
docker compose up
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| FastAPI (Swagger UI) | http://localhost:8000/docs |

> **Note:** Python 3.11 is required — do not upgrade to 3.12+.

***

## Deployment

Deployment is automated via GitHub Actions on every push to `master`.

```
push to master → GitHub Actions (self-hosted runner) → docker compose pull && docker compose up -d
```

***

## Repo Structure

```
fitness-tracker/
├── frontend/               # React (Vite) app
├── api/                    # FastAPI app
├── proxy/                  # Caddy config
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

***

## Constraints

- Single user — no multi-tenancy in v1
- Notion API is the sole data store in v1
- All weights in kg