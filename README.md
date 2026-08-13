# ReproPulse

**ReproPulse** is a CI reliability platform for GitHub Actions. It ingests workflow events and JUnit test reports, detects retry-recovered test failures, calculates transparent flake scores, and presents reliability evidence in a dashboard.

[Repository](https://github.com/bolanosmanny/repropulse) · On-demand AWS demo environment

## Why it exists

A failing CI test is not always a real product regression. Tests can fail because of timing, shared state, network behavior, or nondeterministic dependencies.

ReproPulse helps engineers identify suspicious failures by detecting when a test fails and then passes on a rerun of the **same commit**. Its flake scoring is deterministic and explainable—engineers can inspect the evidence instead of trusting a black-box label.

## Features

- Verifies signed GitHub App webhook deliveries.
- Uses GitHub delivery IDs for idempotency, preventing duplicate webhook processing.
- Ingests JUnit XML through a reusable GitHub Action.
- Stores repositories, workflow runs, test definitions, and executions in PostgreSQL.
- Calculates per-test flake scores from retry-recovered failures.
- Processes webhooks and report ingestion asynchronously with Redis and BullMQ.
- Retries failed jobs with exponential backoff and exposes terminal failures in a dead-letter queue.
- Provides repository-scoped views for workflow history, test history, flake scores, failure trends, and queue health.
- Supports GitHub App installation events and pull-request reliability feedback.
- Exposes operational metrics including webhook success rate and p95 processing latency.

## Architecture

```mermaid
flowchart LR
    GH[GitHub Actions and GitHub App]
    Action[ReproPulse JUnit Upload Action]
    Webhook[Signed GitHub Webhook]
    API[Fastify API]
    Redis[(Redis)]
    Worker[Background Workers]
    DB[(PostgreSQL)]
    Dashboard[Next.js Dashboard]

    GH --> Webhook
    GH --> Action
    Webhook --> API
    Action --> API
    API --> DB
    API --> Redis
    Redis --> Worker
    Worker --> DB
    Dashboard --> API
```

## Test-report flow

```mermaid
sequenceDiagram
    participant CI as GitHub Actions
    participant API as ReproPulse API
    participant Queue as BullMQ / Redis
    participant Worker as Ingestion Worker
    participant DB as PostgreSQL
    participant UI as Dashboard

    CI->>API: Upload JUnit XML and workflow metadata
    API->>DB: Record idempotent ingestion request
    API->>Queue: Queue report-processing job
    API-->>CI: 202 Accepted
    Queue->>Worker: Process report asynchronously
    Worker->>DB: Store workflow run and test executions
    Worker->>DB: Recalculate deterministic flake scores
    UI->>API: Request repository reliability data
    API->>DB: Query metrics and history
    API-->>UI: Render reliability evidence
```

## Flake-score definition

A test is suspicious when it:

1. Fails on a workflow attempt.
2. Passes on a later rerun of the same commit.
3. Has no code change between attempts.

ReproPulse exposes the underlying evidence for every test:

- completed attempts
- transient failures
- rerun-resolved commits
- flake score percentage

## Tech stack

| Area | Technology |
| --- | --- |
| Backend | Node.js, TypeScript, Fastify |
| Dashboard | Next.js, React, TypeScript, Tailwind CSS |
| Database | PostgreSQL, Drizzle ORM |
| Background jobs | Redis, BullMQ |
| GitHub integration | GitHub App, Octokit, GitHub Actions |
| Testing | Vitest |
| Deployment | Docker Compose on AWS EC2 for on-demand end-to-end demos |
| Observability | Fastify and Pino structured logs |

## Reliability engineering decisions

- **Signed webhooks:** invalid GitHub webhook signatures are rejected.
- **Idempotency:** delivery IDs are unique in PostgreSQL, so webhook retries cannot duplicate records.
- **Async processing:** the API acknowledges requests quickly; background workers perform slower ingestion and scoring work.
- **Retries:** BullMQ retries jobs with exponential backoff.
- **Dead-letter visibility:** jobs that exhaust retries remain visible in the Ingestion Jobs dashboard.
- **Repository isolation:** dashboard data is filtered to the selected repository.
- **Transparent scoring:** flake scores are based on observable retry behavior, not an opaque model.

## Deployment verification

ReproPulse was deployed to an AWS EC2 demo environment and verified end-to-end with two real repositories:

- `bolanosmanny/repropulse`
- `bolanosmanny/stratos`

The environment is intentionally run on demand to control cloud costs. During deployment verification on August 13, 2026, ReproPulse processed real GitHub Actions reports successfully:

| Metric | Observed value |
| --- | ---: |
| Connected repositories | 2 |
| Workflow runs ingested | 3 |
| JUnit test executions stored | 51 |
| Webhook processing success rate | 100% |
| p95 webhook processing latency | 112.5 ms |
| Retry-recovered failures observed | 0 at snapshot |

A zero-flake snapshot means no retry-recovered failure had been observed at that time. It does not mean the system assumes a test suite can never be flaky.

## Run locally

### Prerequisites

- Node.js 22+
- Docker Desktop
- A GitHub App, only if testing real installation and webhook flows

### Setup

```bash
git clone https://github.com/bolanosmanny/repropulse.git
cd repropulse
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run db:migrate
```

Add local values to `.env`:

```env
DATABASE_URL=postgresql://repropulse:repropulse_dev_password@localhost:5432/repropulse
REDIS_URL=redis://localhost:6379
GITHUB_WEBHOOK_SECRET=replace_with_a_long_local_secret
REPROPULSE_INGESTION_TOKEN=replace_with_a_long_local_token
```

For live GitHub App installation-token and pull-request features, also configure the GitHub App ID and private key values used by the backend. Never commit secrets.

### Start the application

Start the API:

```bash
npm run dev
```

Start webhook processing:

```bash
npm run worker:webhooks
```

Start JUnit report processing:

```bash
npm run worker:test-reports
```

Start the dashboard:

```bash
cd apps/dashboard
npm install
npm run dev
```

## Run checks

Backend:

```bash
npm run typecheck
npm test
```

Dashboard:

```bash
cd apps/dashboard
npm run lint
```

## Upload JUnit reports from GitHub Actions

ReproPulse includes a reusable action at:

```text
actions/upload-junit
```

Example workflow step:

```yaml
- name: Upload JUnit report to ReproPulse
  if: always() && vars.REPROPULSE_ENDPOINT != ''
  uses: ./actions/upload-junit
  with:
    endpoint: ${{ vars.REPROPULSE_ENDPOINT }}
    ingestion-token: ${{ secrets.REPROPULSE_INGESTION_TOKEN }}
    report-path: reports/junit.xml
    workflow-run-id: ${{ github.run_id }}
```

Store `REPROPULSE_ENDPOINT` as a GitHub Actions variable and `REPROPULSE_INGESTION_TOKEN` as a GitHub Actions secret.

## Future improvements

- Configurable flake-score thresholds.
- Richer pull-request checks and comments for high-risk tests.
- Longer-term reliability trends as more CI history accumulates.
- Optional grouped failure-log summaries.
