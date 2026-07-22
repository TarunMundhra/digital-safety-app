# 🛡️ Digital Public Safety Intelligence Platform

> Transforming isolated fraud reports into actionable cybercrime intelligence.

[![Live App](https://img.shields.io/badge/Production-Live%20App-brightgreen?style=for-the-badge&logo=vercel)](https://digital-safety-app.vercel.app)
[![API Status](https://img.shields.io/badge/API-Render%20Live-blue?style=for-the-badge&logo=render)](https://digital-safety-backend.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/Docs-Swagger%20UI-orange?style=for-the-badge&logo=fastapi)](https://digital-safety-backend.onrender.com/docs)

A state-of-the-art digital safety and fraud prevention platform that combines AI-powered transcript analysis, graph intelligence, geospatial telemetry, counterfeit currency detection, and threat fusion to identify, correlate, and disrupt organized digital fraud operations such as Digital Arrest scams, Customs impersonation campaigns, fake note circulation, phishing infrastructure, and coordinated financial crime networks.

---

### 🌐 Live Production Deployments

* 🚀 **Web Application (Vercel)**: [https://digital-safety-app.vercel.app](https://digital-safety-app.vercel.app)
* ⚡ **API Engine (Render)**: [https://digital-safety-backend.onrender.com](https://digital-safety-backend.onrender.com)
* 📖 **Swagger OpenAPI Documentation**: [https://digital-safety-backend.onrender.com/docs](https://digital-safety-backend.onrender.com/docs)

---

## The Problem

Modern cybercrime is no longer a collection of isolated incidents.

A single fraud operation often involves:

* Multiple phone numbers
* Disposable SIM cards
* UPI identifiers
* Mule bank accounts
* Counterfeit currency circulation networks
* Phishing domains
* Victims distributed across multiple states

Traditional reporting systems capture incidents.

They rarely reveal the network behind them.

As a result, investigators spend significant effort connecting evidence manually while fraud networks continue to operate.

---

## Our Solution

The Digital Public Safety Intelligence Platform (DPSIP) introduces an intelligence-first approach to fraud detection.

Instead of analyzing incidents independently, the platform continuously correlates:

* Citizen reports & Call Transcripts
* Counterfeit Note & Physical Currency Signals
* Financial identifiers (UPI, Bank Accounts)
* Geographic activity & Hotspot Density
* Network relationships & Community Clusters
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

* FastEmbed (`BAAI/bge-small-en-v1.5`)
* ONNX Runtime (384-dimensional vector space)
* Heuristic NLP signal extraction
* Cosine vector similarity search

### Output

* Threat score
* Risk classification
* Triggered scam indicators
* Recommended next actions

---

## 💵 Counterfeit Note & Currency Intelligence Engine

A physical and digital currency verification module that detects fake and counterfeit banknotes circulating within financial networks.

### Detects

* Counterfeit ₹500 & ₹2000 denomination notes
* Security thread misalignment and missing fluorescent ink patterns
* Micro-lettering & watermark anomalies (`RBI`, `500`)
* Serial number font distortion and duplicate serial number syndicates
* Intaglio printing texture variations and bleed artifacts

### Powered By

* Multi-feature visual & structural feature extractors
* High-precision pattern alignment algorithms
* Cross-referencing against reported counterfeit serial number databases

### Output

* Counterfeit Risk Score & Authenticity Verdict
* Highlighted anomaly feature points
* Automatic link generation to known currency forging syndicates in the Graph Engine

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
* Devices & Counterfeit Note Serial Syndicates

Using NetworkX and Louvain community detection, the system identifies coordinated fraud rings and co-accused clusters.

### Capabilities

* Connected component analysis
* Community detection (Louvain modularity optimization)
* Fraud cluster generation
* Cross-state network discovery

---

## 🧠 Agentic Fusion Engine

Individual signals are often weak. Combined signals reveal intent.

The Fusion Engine correlates:

* NLP threat indicators
* Counterfeit currency report signals
* Graph intelligence
* SIM activation age & out-degree fan-out rates
* Historical risk scores

to generate a unified intelligence score and escalation recommendation.

---

# 🏗 System Architecture

```text
Citizen Reports / Note Images
       │
       ▼
 ┌───────────────┐
 │ Citizen Shield│
 └───────┬───────┘
         │
 ┌───────┴───────┬─────────────────────────┐
 ▼               ▼                         ▼
NLP        FastEmbed               Counterfeit Currency
Engine     Vector Engine           Detection Engine
 │               │                         │
 └───────┬───────┴─────────────────────────┘
         ▼
   Fusion Engine
         │
 ┌───────┼────────────┐
 ▼       ▼            ▼
Graph    Geo      Intelligence
AI       AI       Generation
 │        │
 └────────┴───────────┐
                      ▼
   PostgreSQL + PostGIS + pgvector
                      │
                      ▼
                    Redis
```

---

# 🛠 Technology Stack

## Frontend

* React & TypeScript
* Vite
* Tailwind CSS
* Leaflet Maps

## Backend

* FastAPI
* SQLAlchemy & GeoAlchemy2
* FastEmbed (ONNX Runtime)
* NetworkX & python-louvain
* ReportLab (PDF Intelligence Package Generator)

## Data Layer

* PostgreSQL + PostGIS + pgvector
* Redis (Sub-millisecond caching)

---

# 📡 API Overview

### Live Production Base URL
`https://digital-safety-backend.onrender.com`

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/shield/check` | `POST` | Analyze suspicious call transcripts & calculate risk score |
| `/api/v1/geo/hotspots` | `GET` | Retrieve regional fraud hotspot density across India |
| `/api/v1/graph/clusters` | `GET` | Detect Louvain community clusters & fraud syndicates |
| `/api/v1/graph/cross-state` | `GET` | Identify multi-state cross-jurisdiction fraud rings |
| `/api/v1/fusion/evaluate` | `POST` | Perform multi-signal threat fusion & escalation analysis |
| `/api/v1/seed/all` | `POST` | Pre-populate database with rich demonstration dataset |

---

# 🚀 Local Setup & Installation

```bash
# 1. Clone repository
git clone https://github.com/TarunMundhra/digital-safety-app.git
cd digital-safety-app

# 2. Run full stack with Docker Compose
docker compose up -d --build
```

### Access Local Services

| Service | Local URL | Production URL |
| :--- | :--- | :--- |
| **Frontend App** | `http://localhost:5173` | [https://digital-safety-app.vercel.app](https://digital-safety-app.vercel.app) |
| **FastAPI Backend** | `http://localhost:8000` | [https://digital-safety-backend.onrender.com](https://digital-safety-backend.onrender.com) |
| **Swagger API Docs** | `http://localhost:8000/docs` | [https://digital-safety-backend.onrender.com/docs](https://digital-safety-backend.onrender.com/docs) |
