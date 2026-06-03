# Muyu: Invoice Generator

A lightweight, server-side rendered (SSR) application built with Node.js and Express for generating and managing business invoices. 

## Prerequisites

Before running the application, ensure you have the following tools installed:

- **Node.js**: v24.16.0 (Environment managed via [mise](https://mise.jdx.dev/))
- **Docker & Docker Compose**: Required for containerized database orchestration.
- **Trivy**: (Optional) For dependency security scanning.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Templating**: EJS
- **Frontend Interactivity**: Alpine.js (Lightweight reactive state)
- **Styling**: Tailwind CSS (Pre-compiled)
- **Database**: PostgreSQL (via `pg` client)
- **PDF Generation**: PDFKit (Streamed responses)
- **Security**: Helmet.js (CSP and Secure Headers)
- **Logging**: Morgan (Human-readable, searchable text logs)

## Getting Started

### 1. Database Setup
Launch the containerized PostgreSQL instance in the background:
```bash
docker-compose up -d
```

### 2. Environment Configuration
The application requires the following environment variables. These are pre-configured in `mise.toml` for local development.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://invoice_user:invoice_pass@localhost:5432/invoice_db` |
| `PORT` | Application server port | `3000` |
| `LOG_LEVEL` | Logging verbosity (info, warn, error) | `info` |

### 3. Application Startup
Use `mise` to automatically install dependencies and launch the server:
```bash
mise run start
```
The application will be accessible at `http://localhost:3000`.

## Development & Quality Control

### Local Development
Run the server with automatic restarts enabled (Node.js watch mode):
```bash
npm run dev
```

### Running Tests
The project enforces high code coverage (>80%) for all backend logic and routes using Jest:
```bash
npm test
```

### Security Scanning
Verify the security of project dependencies using the integrated Trivy task:
```bash
mise run scan-dependencies
```

## Project Structure

```text
├── public/          # Static assets (CSS, browser scripts)
├── src/
│   ├── services/    # Business logic (DB, PDF, Calculations, Logging)
│   └── web.js       # Express application entry, middleware, and routing
├── tests/           # Unit and Integration test suites
└── views/           # EJS templates for the user interface
```

## API Endpoints

- **`GET /`**: Main dashboard and invoice generation form.
- **`GET /health`**: System health check; returns status and ISO timestamp.
- **`POST /generate`**: Validates invoice data, saves metadata to the database, and initiates a PDF download.
