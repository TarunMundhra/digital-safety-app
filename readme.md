# 🛡️ Digital Public Safety Intelligence Platform

> Transforming isolated fraud reports into actionable cybercrime intelligence.

A state-of-the-art digital safety and fraud prevention platform that combines AI-powered transcript analysis, graph intelligence, geospatial telemetry, and threat fusion to identify, correlate, and disrupt organized digital fraud operations such as Digital Arrest scams, Customs impersonation campaigns, phishing infrastructure, and coordinated financial crime networks.

---

## The Problem

Modern cybercrime is no longer a collection of isolated incidents.

A single fraud operation often involves:

* Multiple phone numbers
* Disposable SIM cards
* UPI identifiers
* Mule bank accounts
* Phishing domains
* Victims distributed across multiple states

Traditional reporting systems capture incidents.

They rarely reveal the network behind them.

As a result, investigators spend significant effort connecting evidence manually while fraud networks continue to operate.

---

## Our Solution

The Digital Public Safety Intelligence Platform (DPSIP) introduces an intelligence-first approach to fraud detection.

Instead of analyzing incidents independently, the platform continuously correlates:

* Citizen reports
* Conversation transcripts
* Financial identifiers
* Geographic activity
* Network relationships
* Threat intelligence feeds

to uncover hidden criminal infrastructure and generate actionable intelligence.

---

# 🌟 Core Intelligence Modules

## 🛡 Citizen Fraud Shield

An AI-assisted fraud analysis engine that evaluates suspicious conversations and call transcripts in real time.

### Detects

* Police impersonation
* CBI impersonation
* Customs impersonation
* Digital arrest threats
* OTP extraction attempts
* Aadhaar/PAN collection
* Financial coercion tactics

### Powered By

* FastEmbed
* ONNX Runtime
* Heuristic NLP signal extraction
* Vector similarity search

### Output

* Threat score
* Risk classification
* Triggered scam indicators
* Recommended next actions

---

## 🌍 Geospatial Intelligence Layer

Transforms scattered fraud reports into operational geographic intelligence.

Using PostGIS and Leaflet, investigators can visualize:

* Fraud concentration zones
* Regional threat density
* Emerging scam hotspots
* Cross-jurisdiction activity

The result is a live operational map of digital fraud activity.

---

## 🕸 Graph Intelligence Engine

Fraud networks leave relationship trails.

The platform reconstructs connections between:

* Phone Numbers
* UPI IDs
* Bank Accounts
* PAN Numbers
* Aadhaar Identifiers
* Devices

Using NetworkX and Louvain community detection, the system identifies coordinated fraud rings and co-accused clusters.

### Capabilities

* Connected component analysis
* Community detection
* Fraud cluster generation
* Cross-state network discovery

---

## 🧠 Agentic Fusion Engine

Individual signals are often weak.

Combined signals reveal intent.

The Fusion Engine correlates:

* NLP threat indicators
* Graph intelligence
* SIM activation age
* Network fan-out behavior
* Historical risk scores

to generate a unified intelligence score and escalation recommendation.

Example:

A newly activated SIM associated with multiple fraud clusters automatically receives elevated risk weighting and triggers immediate escalation recommendations.

---

## 📊 Observability & Monitoring

The platform includes a complete monitoring stack.

### Components

* Prometheus Metrics Collection
* Grafana Dashboards
* Service Health Monitoring
* Performance Telemetry

This provides complete visibility into system behavior and operational performance.

---

# 🏗 System Architecture

```text
Citizen Reports
       │
       ▼
 Citizen Shield
       │
 ┌─────┴─────┐
 ▼           ▼
NLP      Embeddings
Engine     Engine
 │           │
 └─────┬─────┘
       ▼
 Fusion Engine
       │
 ┌─────┼────────────┐
 ▼     ▼            ▼
Graph  Geo      Intelligence
AI     AI       Generation
 │      │
 └──────┴────────────┐
                     ▼
 PostgreSQL + PostGIS + pgvector
                     │
                     ▼
                   Redis
```

---

# 🛠 Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Leaflet Maps

## Backend

* FastAPI
* SQLAlchemy
* GeoAlchemy2
* FastEmbed
* NetworkX
* ReportLab

## Data Layer

* PostgreSQL
* PostGIS
* pgvector
* Redis

## DevOps & Monitoring

* Docker Compose
* Prometheus
* Grafana

---

# 📂 Project Structure

```bash
digitalSafety/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── db/
│   │   ├── routers/
│   │   ├── services/
│   │   └── main.py
│   ├── scripts/
│   ├── Dockerfile
│   ├── db.Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

---

# 📡 API Overview

### Citizen Shield

```http
POST /api/v1/shield/check
```

Analyze suspicious call transcripts and generate fraud risk assessments.

---

### Geospatial Intelligence

```http
GET /api/v1/geo/hotspots?days=30
```

Retrieve aggregated fraud hotspots and regional threat distributions.

---

### Graph Intelligence

```http
GET /api/v1/graph/clusters
POST /api/v1/graph/detect
GET /api/v1/graph/cross-state
POST /api/v1/graph/intel-package/{cluster_id}
```

Generate network intelligence and investigation packages.

---

### Agentic Fusion

```http
POST /api/v1/fusion/evaluate
POST /api/v1/fusion/evaluate/{call_session_id}
```

Perform multi-signal threat fusion and escalation analysis.

---

# 🚀 Getting Started

## Start the Platform

```bash
docker compose up -d --build
```

## Seed Sample Data

```bash
docker compose exec backend python scripts/seed/generate_scam_transcripts.py
```

## Access Services

| Service            | URL                        |
| ------------------ | -------------------------- |
| Frontend Dashboard | http://localhost:5173      |
| FastAPI Docs       | http://localhost:8000/docs |
| Prometheus         | http://localhost:9090      |
| Grafana            | http://localhost:3000      |

---

# 🎯 Impact

### Citizens

* Early scam detection
* Safer reporting experience
* Reduced financial losses

### Financial Institutions

* Brand abuse monitoring
* Phishing infrastructure discovery
* Threat intelligence enrichment

### Law Enforcement

* Fraud ring identification
* Cross-state investigations
* Automated intelligence reports

### Government Agencies

* National fraud visibility
* Data-driven intervention
* Emerging threat detection

---

# 🔮 Future Roadmap

* Real-time call analysis
* Voice-to-intelligence pipelines
* Multilingual scam detection
* National fraud intelligence exchange
* Predictive fraud forecasting
* Automated inter-agency escalation

---

## Vision

Cybercrime investigations should not begin after damage has already occurred.

Our vision is to create an intelligence layer capable of detecting, correlating, and disrupting organized fraud networks before additional victims are affected.

**From incident reporting to intelligence-driven public safety.**
