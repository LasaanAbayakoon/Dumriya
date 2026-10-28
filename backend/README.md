# Dumriya backend

The API that will replace the frontend's mock data (`src/api/mock`). Python 3.12, FastAPI, PostgreSQL 16 with PostGIS.

> Not affiliated with Sri Lanka Railways. Until real timetables are loaded, all data is sample data.

## What you need

- [uv](https://docs.astral.sh/uv/): installs Python packages into `backend/.venv`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/): runs the database

uv reads `.python-version` and uses Python 3.12. If 3.12 isn't installed, it downloads it.

## Run it

All commands are run from `backend/`.

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
# then edit .env: set a new POSTGRES_PASSWORD, and the same password in DATABASE_URL

docker compose up -d          # start the database
docker compose ps             # wait until STATUS says "healthy"

uv sync                       # create .venv and install everything (first time, and after pulling)
uv run uvicorn app.main:app --reload    # http://localhost:8000, interactive docs at /docs
```

## Check it

| URL | Expected |
|---|---|
| `GET /health` | `{"status": "ok", "version": "0.1.0"}` |
| `GET /health/db` | `{"database": "ok"}`, or **503** with a message if the database can't be reached |

Stop the database to see the 503: `docker compose stop db`. Start it again with `docker compose start db`.

## Tests and lint

```bash
uv run pytest                 # tests
uv run ruff check .           # lint
uv run ruff format .          # format (CI runs `ruff format --check .`)
```

CI (GitHub Actions) runs ruff and pytest on every push, against a real PostgreSQL + PostGIS service container.

## Stopping and resetting

```bash
docker compose down           # stop and remove the container; data is kept in the "pgdata" volume
docker compose down -v        # also delete the data
```

## Layout

```
backend/
  app/                 the application
  tests/               pytest tests
  pyproject.toml       dependencies and tool settings (pytest, ruff)
  uv.lock              exact versions of every package (commit it)
  docker-compose.yml   local database
  .env.example         settings template; copy to .env (never committed)
```
