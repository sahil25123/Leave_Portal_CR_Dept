# Leave Portal Production Deployment

This repository is prepared for Docker-based production deployment on the IITD CSC server with the application served under `/leave-portal/`.

## Architecture

- CSC existing nginx receives public traffic.
- CSC nginx proxies `/leave-portal/` to the frontend container.
- CSC nginx proxies `/api/` to the backend container.
- The backend talks to MySQL through the internal Docker network only.
- MySQL is not publicly exposed and persists data in `mysql_data`.

## Files

- `docker-compose.yml` orchestrates the frontend, backend, and MySQL containers.
- `backend/Dockerfile` builds the API image and runs Prisma generate during build.
- `frontend/Dockerfile` builds the React app with the `/leave-portal/` base path.
- `csc-nginx.conf` is the snippet for the CSC nginx team.
- `deploy.sh` rebuilds and deploys the stack.
- `.env.example` documents the required environment variables.

## Environment Setup

1. Copy `.env.example` to `.env` in the repository root.
2. Set strong values for `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, and `JWT_SECRET`.
3. Update the public URLs to match the IITD server hostname.

Important values:

- `FRONTEND_URL` should point to the public app URL, for example `https://your-host/leave-portal`.
- `BACKEND_URL` should point to the public API URL, for example `https://your-host/api`.
- `FRONTEND_ORIGIN` and `CORS_ORIGIN` should be the scheme + host only, for example `https://your-host`.
- `DATABASE_URL` must use the Docker service name `mysql`.

## Deploy

Run the deployment script from the repository root:

```bash
./deploy.sh
```

What it does:

1. Stops existing containers.
2. Rebuilds the backend and frontend images.
3. Starts MySQL and waits for it to become healthy.
4. Runs `Prisma migrate deploy`.
5. Starts the backend and frontend containers.
6. Prints service status.

## Manual Docker Commands

Build the services:

```bash
docker compose build backend frontend
```

Start the database:

```bash
docker compose up -d mysql
```

Run Prisma migrations manually:

```bash
docker compose run --rm --no-deps backend npm run prisma:migrate:deploy
```

Start the application services:

```bash
docker compose up -d backend frontend
```

Show running containers:

```bash
docker compose ps
```

## Logs

- `docker compose logs -f backend`
- `docker compose logs -f frontend`
- `docker compose logs -f mysql`

## Restart

Restart a single service:

```bash
docker compose restart backend
```

Restart the full stack:

```bash
docker compose restart
```

To perform a clean redeploy, run `./deploy.sh` again.

## CSC Nginx Snippet

Use `csc-nginx.conf` as the reverse proxy reference for the server team.

- `/leave-portal/` proxies to `127.0.0.1:4173`
- `/api/` proxies to `127.0.0.1:5000`

The frontend container handles SPA fallback routing for deep links such as `/leave-portal/dashboard`.

## Troubleshooting

- If MySQL does not start, check `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` in `.env`.
- If migrations fail, verify `DATABASE_URL` points to `mysql` inside Docker.
- If the frontend shows blank assets, confirm CSC nginx is proxying `/leave-portal/` with the provided snippet and that Vite was built with the `/leave-portal/` base.
- If API requests fail, confirm `/api/` reaches the backend container and that `FRONTEND_ORIGIN` or `CORS_ORIGIN` matches the public host.
- If file uploads fail, confirm the backend container has write access to `/app/uploads` and that nginx is forwarding `/api/` without rewriting the path.

## Security Notes

- MySQL is internal-only on the Docker network.
- No secrets are hardcoded in the repository files.
- Public ports are bound to `127.0.0.1` only, so CSC nginx remains the public entry point.