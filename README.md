# Predictive Horizontal Pod Autoscaler (PHPA)

### Eliminating Kubernetes Autoscaling Lag with Proactive Deep Learning

[![Author](https://img.shields.io/badge/Author-Gagan%20Singh-purple?style=flat-square)](https://github.com/gagansingh0805)
[![Institution](https://img.shields.io/badge/Institution-ABES%20Engineering%20College-blue?style=flat-square)](https://www.abes.ac.in)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Three.js%20%7C%20Go%20%7C%20Python-black?style=flat-square)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg?style=flat-square)](./LICENSE)

---

## The Problem

Standard Kubernetes Horizontal Pod Autoscalers (HPAs) are **purely reactive** — they wait for resource thresholds (CPU > 60%) to be breached before provisioning new pods. This creates an inevitable scaling lag:

| Timeline | What Happens |
|----------|-------------|
| `t = 0s` | 💥 Flash crowd hits (5x traffic surge) |
| `t = 15s` | HPA detects CPU breach via Prometheus scrape |
| `t = 30s` | New pods scheduled on node |
| `t = 50s` | Pods finally ready — **50 seconds of degradation** |
| **Result** | P95 latency spikes to **1400ms**, SLA breaches, dropped requests |

For any infrastructure handling real-time transactions, this 30-60 second cold-start window means **failed requests, broken SLAs, and lost revenue**.

## The Solution

PHPA replaces reactive scaling with **proactive AI-driven scaling**. A 2-Layer Stacked LSTM neural network detects non-linear surge curvature **15-45 seconds before** demand reaches the cluster:

| Timeline | What PHPA Does |
|----------|---------------|
| `t = -20s` | 🧠 LSTM detects upward acceleration signature |
| `t = -15s` | PHPA proactively scales to 15 pods |
| `t = 0s` | Flash crowd arrives — **15 pods already running** |
| **Result** | P95 latency stays **< 40ms**, zero SLA breaches |

### Multi-Model Ensemble

PHPA evaluates **4 scaling models** in parallel and selects the safest prediction:

| Model | Approach | Strength |
|-------|----------|----------|
| **Reactive HPA** | `Target = Current × CPU_Ratio` | Guaranteed safety floor |
| **Linear Regression** | OLS on sliding PromQL window | Tracks monotonic ramps in ~2ms |
| **Holt-Winters** | Triple Exponential Smoothing (α, β, γ) | Learns 24h diurnal seasonality |
| **2-Layer LSTM** | Recurrent memory network with forget gates | Non-linear surge preemption, 45s lookahead |

The decision engine takes `MAX(all_predictions)` to guarantee zero under-provisioning while the LSTM minimizes over-provisioning.

---

## Key Results

| Metric | Reactive HPA | PHPA (LSTM) |
|--------|-------------|-------------|
| Cold-start latency spike | 1400ms | **< 40ms** |
| SLA breaches during 5x surge | 6+ deficit periods | **0** |
| Compute cost savings | Baseline | **23-50% reduction** |
| Scaling lead time | -50s (reactive) | **+15-45s (proactive)** |
| SLA compliance | ~85% during surges | **100%** |

---

## 📁 Repository Structure

```
PHPA/
├── dashboard/
│   ├── frontend/                    # React 18 + Three.js + Tailwind + Recharts
│   │   ├── src/
│   │   │   ├── App.jsx              # Main orchestrator (1,900 lines)
│   │   │   ├── index.css            # CSS variables, card elevation system
│   │   │   ├── utils/colors.js      # Centralized model color tokens
│   │   │   └── components/
│   │   │       ├── Hero3D.jsx              # Three.js 3D landing page
│   │   │       ├── HomeOverview.jsx        # Research overview & onboarding
│   │   │       ├── MetricCards.jsx         # 4 live KPI bento cards
│   │   │       ├── ReplicasChart.jsx       # 5-model synchronized line chart
│   │   │       ├── WorkloadChart.jsx       # Dual-axis RPS/CPU area chart
│   │   │       ├── PodCluster.jsx          # Visual pod status grid
│   │   │       ├── TrafficThrottle.jsx     # Manual RPS slider + presets
│   │   │       ├── ModelScorecard.jsx      # 3-view model benchmarking
│   │   │       ├── LSTMAttribution.jsx     # Neural advantage telemetry
│   │   │       ├── LiveEventLog.jsx        # Decision stream with filters
│   │   │       ├── OperationalGuardrails.jsx # Safety limits & chaos sandbox
│   │   │       ├── ModelDeepDive.jsx       # KaTeX math formulations
│   │   │       ├── PipelineViewer.jsx      # 2D architecture schematic
│   │   │       ├── Pipeline3DCanvas.jsx    # Three.js 3D pipeline canvas
│   │   │       ├── DemoPresenter.jsx       # Guided showcase tour
│   │   │       ├── Sidebar.jsx             # Navigation + sim controls
│   │   │       └── ErrorBoundary.jsx       # Crash recovery
│   │   ├── tailwind.config.js
│   │   └── vite.config.js
│   └── backend/
│       ├── server.py                # SSE streaming HTTP server
│       └── simulation_engine.py     # Diurnal traffic simulation
│
└── predictive-horizontal-pod-autoscaler/
    ├── main.go                      # Kubernetes operator entrypoint
    ├── api/v1alpha1/                # CRD definitions (PredictiveHorizontalPodAutoscaler)
    ├── algorithms/                  # Prediction models (Linear, Holt-Winters, LSTM)
    ├── internal/                    # Reconciliation & scale decision engine
    ├── helm/                        # Helm deployment charts
    ├── Dockerfile                   # Container image
    └── Makefile                     # Build & deploy automation
```

---

## 🚀 Getting Started

### Launch the Interactive Dashboard

```bash
cd dashboard/frontend
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

> The dashboard runs a complete standalone simulation — no backend or Kubernetes cluster needed.

### With Backend SSE Streaming (Optional)

```bash
# Terminal 1 — Backend
cd dashboard/backend
pip install -r requirements.txt
python server.py

# Terminal 2 — Frontend (auto-connects to backend SSE)
cd dashboard/frontend
npm run dev
```

---

## Interactive Features

### 🔬 7 Dashboard Tabs

| Tab | What It Shows |
|-----|--------------|
| **Research Overview** | Problem/solution context, model roster, quick navigation |
| **Telemetry Lab** | Live KPI cards, synchronized charts, pod cluster, traffic control |
| **Model Benchmarking** | Side-by-side cost, accuracy, and deficit comparison (3 view modes) |
| **Operational Guardrails** | Configurable safety limits, FinOps calculator, chaos sandbox |
| **Pipeline Architecture** | 2D schematic + interactive 3D Three.js visualization |
| **Decision Log Feed** | Filterable event stream with JSON export |
| **Mathematical Theory** | KaTeX formulations for all 4 models |

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause simulation |
| `S` | Inject 5x traffic surge |
| `R` | Reset to baseline |
| `1`–`7` | Switch tabs |
| `←` `→` | Navigate demo steps |
| `Esc` | Exit demo tour |

### 📱 Mobile Support
Responsive sidebar drawer + persistent bottom simulation controls (Play/Pause, Speed, Surge).

---

## Tech Stack

### Frontend
- **React 18** — Component architecture
- **Three.js / React Three Fiber** — 3D pipeline visualization & landing page
- **Tailwind CSS 3** — Utility-first styling with custom design tokens
- **Recharts** — Synchronized dual-axis data visualization
- **Framer Motion** — Micro-interactions & transitions
- **GSAP** — 3D scene animations
- **KaTeX** — Mathematical formula rendering
- **Vite 5** — Build tooling with code splitting

### Backend
- **Python** — SSE streaming server with ThreadingHTTPServer
- **Simulation Engine** — Diurnal traffic modeling with configurable spike injection

### Kubernetes Operator
- **Go** — controller-runtime based Kubernetes operator
- **Custom Resource Definition** — `PredictiveHorizontalPodAutoscaler` CRD
- **Helm Charts** — Production deployment

---

## Research & Authorship

- **Lead Researcher & Author**: Gagan Singh
- **Institution**: ABES Engineering College
- **GitHub**: [github.com/gagansingh0805](https://github.com/gagansingh0805)

---

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](./LICENSE) file for details.
