# Digital Public Safety Intelligence Platform

A state-of-the-art digital safety and fraud prevention platform built with modern web technologies, spatial telemetry, and network graph analysis to identify and mitigate digital scams (e.g., Digital Arrest and Customs impersonation scams).

---

## 🌟 Key Features

1. **Citizen Fraud Shield:** Instant transcript analysis using Local ONNX-based vector embeddings (`fastembed`) and NLP rules to compute threat risk scores.
2. **Geospatial Hotspots Map:** Interactive Leaflet GIS map visualization showing real-time geographical distribution of reported scams using PostGIS.
3. **Graph Intelligence:** Network community detection using NetworkX and Louvain heuristics to identify co-accused fraud clusters.
4. **Agentic Fusion Engine:** Combined evaluation model leveraging graph telemetry and call indicators to trigger escalations (e.g., immediate dispatch recommendations).
5. **Observability Stack:** Metrics scraping with Prometheus and visual monitoring dashboards in Grafana.

---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet Maps
- **Backend:** FastAPI, SQLAlchemy, GeoAlchemy2, pgvector, Redis, FastEmbed, NetworkX, ReportLab (PDF Generation)
- **Data Tier:** PostgreSQL (with PostGIS, pgvector, and uuid-ossp extensions)
- **DevOps:** Docker Compose, Prometheus, Grafana

---

## 📂 Project Structure

```
digitalSafety/
├── backend/
│   ├── app/
│   │   ├── core/           # Settings & configuration
│   │   ├── db/             # SQLAlchemy models and connection
│   │   ├── routers/        # FastAPI endpoints (Scam, Graph, Fusion, Geo, Shield)
│   │   ├── services/       # Core business logic (Scam analysis, Louvain graph, GeoJSON maps)
│   │   └── main.py         # App entrypoint & database creation
│   ├── scripts/            # Database seed and load testing scripts
│   ├── Dockerfile          # Python backend Docker build configuration
│   ├── db.Dockerfile       # Custom PostgreSQL build (PostGIS + pgvector)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main React Dashboard
│   │   ├── main.tsx        # React entrypoint
│   │   └── index.css       # Tailwind directives
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── postcss.config.js   # CSS processing config
│   └── tailwind.config.js  # Tailwind utility styles config
├── docker-compose.yml      # Container orchestration
├── prometheus.yml          # Prometheus metrics configuration
├── start.log               # CLI commands and start instructions
└── readme.md               # Documentation guide (this file)
```

---

## 🚀 Getting Started

Read the detailed [start.log](file:///c:/Users/91934/Desktop/development/digitalSafety/start.log) file for the list of startup commands.

### Quick Start:

1. **Spin up the stack:**
   ```bash
   docker compose up -d --build
   ```

2. **Seed the database:**
   ```bash
   docker compose exec backend python scripts/seed/generate_scam_transcripts.py
   ```

3. **Verify the Ports:**
   - **Frontend UI:** http://localhost:5173
   - **FastAPI docs:** http://localhost:8000/docs
   - **Prometheus UI:** http://localhost:9090
   - **Grafana UI:** http://localhost:3000

---

## 📡 API Endpoints Summary

### 🛡 Citizen Shield
- `POST /api/v1/shield/check` - Analyze suspicious call transcripts with NLP rules and store anonymously.

### 📍 Geospatial
- `GET /api/v1/geo/hotspots?days=30` - Fetch aggregated city-level hotspots with coordinates.

### 🕸 Graph Intelligence
- `GET /api/v1/graph/clusters` - Retrieve detected connected components using BFS.
- `POST /api/v1/graph/detect` - Detect fraud clusters using Louvain partitioning.
- `GET /api/v1/graph/cross-state` - Retrieve cross-jurisdiction fraud nodes.
- `POST /api/v1/graph/intel-package/{cluster_id}` - Generate and download PDF intelligence packages.

### 🧠 Agentic Fusion
- `POST /api/v1/fusion/evaluate` - Evaluate call session using JSON payload body.
- `POST /api/v1/fusion/evaluate/{call_session_id}` - Evaluate a call session based on network telemetry using path parameter.

### 🗄 Seeding
- `POST /api/v1/seed` - Drop and seed all tables with sample fraud session datasets.
