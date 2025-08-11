# AI‑Powered Workflow Automation Platform

This repository contains a fully‑featured web application that acts as a frontend for an AI‑powered workflow automation platform. Users can describe automation needs in plain language and an AI agent will translate those requests into production‑ready workflows using the [n8n](https://n8n.io/) ecosystem. The application also manages user accounts, credentials for third‑party services, workflow execution history and more.

## ✨ Features

* **Chat‑to‑Workflow** – Users can chat with an AI assistant to describe desired automations. The backend sends the conversation to your configured LLM (via [OpenRouter](https://openrouter.ai) or another provider) and leverages the n8n API to build workflows.
* **Workflow Management** – View all your workflows, toggle their active status, run them manually, clone, edit and delete them. Inspect individual workflows with a read‑only visualiser, a raw configuration editor and a detailed execution history.
* **Credential Vault** – Securely store API keys and tokens for services like Slack, Google, Typeform and OpenAI. Credentials are encrypted at rest using AES‑256 (see `ENCRYPTION_KEY` in your environment). Test connectivity and revoke access from the UI.
* **User & Account Management** – Register and log in with JWT authentication. Update your profile and manage your subscription plan (stubbed for future integration with billing providers like Stripe).
* **Dark‑Themed UI** – A modern dark interface inspired by the [Vapi dashboard](https://dashboard.vapi.ai/) with animations, transitions and a two‑panel layout. Built with [React](https://react.dev/) and [Mantine](https://mantine.dev/) for rapid development.

## 🏗️ Architecture

The application is split into a **backend** and **frontend**, orchestrated with **Docker Compose** for easy deployment. An optional `n8n‑mcp` service is included for advanced AI agent tooling.

### Backend

* **Node.js / Express** server with RESTful endpoints for authentication, chat, workflow management, credential management and user settings.
* **Prisma** ORM with a PostgreSQL database stores users, workflows, credentials and execution logs.
* **JWT** for stateless authentication and **bcrypt** for password hashing.
* **AES‑256 encryption** for credential storage (see `src/utils/crypto.js`).
* **n8n client** (in `src/utils/n8n.js`) wraps calls to your n8n instance’s REST API. Configure `N8N_API_URL` and `N8N_API_KEY` in your environment to enable creating and managing workflows.
* **LLM client** (in `src/routes/chat.js`) forwards chat messages to OpenRouter or any OpenAI‑compatible API. Provide your API key via `OPENROUTER_API_KEY`.

### Frontend

* **React** application bootstrapped with **Vite**. Routing is handled by `react-router-dom`.
* **Mantine** component library for a cohesive dark theme, responsive layouts and ready‑made components (forms, tables, modals, notifications).
* **Framer Motion** brings subtle animations to chat messages and page transitions.
* **Zustand** manages global auth state and persists it to local storage.
* **React Query** handles data fetching, caching and automatic refetching of workflows and credentials.
* **React Flow Renderer** visualises workflow nodes and connections in a read‑only diagram.

### Docker Composition

The provided `docker-compose.yml` defines four services:

1. **db** – A PostgreSQL instance storing all persistent data.
2. **backend** – Builds and runs the Express server. It applies Prisma migrations on startup and exposes port `3001`.
3. **frontend** – Builds the React app and serves it via nginx on port `3000`. The nginx configuration proxies all `/api` requests to the backend.
4. **n8n‑mcp** – Runs the [n8n‑MCP](https://github.com/czlonkowski/n8n-mcp) server so that AI assistants can access detailed n8n node documentation and management tools. This service is optional but recommended for advanced AI workflows.

## 🚀 Getting Started

### Prerequisites

* [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed on your system.
* An API key for your chosen LLM provider. The app is configured to work with [OpenRouter](https://openrouter.ai) by default but can be adapted to any OpenAI‑compatible API.
* (Optional) A running n8n instance and API key if you want workflows to be persisted and executed in n8n. Without these values the app will still function, but workflow operations will be no‑ops.

### Setup

1. **Clone the repository** (or extract the provided ZIP) and navigate into it.

   ```bash
   git clone https://your-repo-url.git
   cd webapp
   ```

2. **Create an environment file for the backend**. Copy `backend/.env.example` to `backend/.env` and fill in the values. At minimum you must set `JWT_SECRET`, `ENCRYPTION_KEY` and `OPENROUTER_API_KEY`.

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your preferred values
   ```

3. **Build and start the services** with Docker Compose:

   ```bash
   docker-compose up --build
   ```

   The frontend will be available at [http://localhost:3000](http://localhost:3000), the backend API at [http://localhost:3001](http://localhost:3001) and the n8n‑MCP server at [http://localhost:3002](http://localhost:3002).

4. **Register a new account** via the web UI. You can now chat with the assistant, create workflows and manage your credentials.

### Customisation

* **LLM Provider** – Change `OPENROUTER_BASE_URL`, `OPENROUTER_DEFAULT_MODEL` and provide your own API key in the backend `.env` file to use a different model or provider. The chat endpoint follows the OpenAI `chat/completions` schema.
* **n8n Integration** – Point `N8N_API_URL` and `N8N_API_KEY` to your n8n instance to enable creating, updating and running workflows. See the [n8n REST API docs](https://docs.n8n.io/api/) for details.
* **Styling** – The frontend uses Mantine’s dark theme by default. You can modify global theme settings in `src/main.jsx` or replace Mantine with another UI library.

## 🛡️ Security Considerations

* **Encryption at rest** – Credential data is encrypted using AES‑256 before being persisted to the database. Never commit your `ENCRYPTION_KEY` to version control.
* **Authentication** – JWT tokens are stored in local storage via `zustand` persistence. In a production environment consider using HTTP‑only cookies instead.
* **Production Secrets** – Do **not** run this project in production with the example secrets. Always set strong, random secrets and rotate them regularly.

## 📚 Further Reading

* The [n8n Blog](https://blog.n8n.io/ai-agent-frameworks/) compares several AI agent frameworks and highlights why n8n is a strong choice for building agentic workflows. It notes that n8n combines visual development with robust integrations and supports memory management, RAG, and flexible LLM selection【929786400724279†L466-L584】.
* OpenRouter is an inference marketplace providing access to over 300 models through a single OpenAI‑compatible API. Developers choose OpenRouter for its ability to route traffic across multiple providers, offering automatic failover and competitive pricing【855525579920782†L184-L229】.
* The [n8n‑MCP README](https://github.com/czlonkowski/n8n-mcp) details available tools for node search, workflow management and validation. It highlights features like smart node search, essential property extraction and workflow validation【793122065525226†L540-L601】.

## ✅ License

This project is licensed under the MIT License. See `LICENSE` for more information.