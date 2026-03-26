# Backend Service

## What It Provides

- `GET /api/health` health check
- `GET /api/ai/quota` daily quota status
- `POST /api/ai/analyze` AI streaming analyze (SSE)
- `GET /api/archive` archive list for current session
- `POST /api/archive` create archive
- `PUT /api/archive/:id` update archive
- `DELETE /api/archive/:id` delete archive

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Edit `.env` and set `DEEPSEEK_API_KEY`.

3. Install and start:

```bash
npm install
npm start
```

Default URL: `http://localhost:8081`
