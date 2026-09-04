# Predictive Horizontal Pod Autoscaler (PHPA) with Proactive Deep Learning (LSTM)

[![Author](https://img.shields.io/badge/Author-Gagan%20Singh-purple?style=flat-square)](https://github.com/gagansingh0805)
[![Institution](https://img.shields.io/badge/Institution-ABES%20Engineering%20College-blue?style=flat-square)](https://www.abes.ac.in)
[![GitHub](https://img.shields.io/badge/GitHub-gagansingh0805-black?style=flat-square&logo=github)](https://github.com/gagansingh0805)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg?style=flat-square)](./LICENSE)

---

## 🔬 Research Overview

In modern cloud computing, standard Kubernetes Horizontal Pod Autoscalers (HPAs) exhibit a critical flaw: **reactive scaling lag**. Because HPAs wait for resource thresholds (e.g. CPU > 60%) to be breached before provisioning new pods, metric polling intervals (15–30s) and container startup latencies (30–60s) inevitably produce severe SLA degradation during sudden flash crowd traffic surges.

This project implements and evaluates an **ensemble proactive autoscaling system** combining:
1. **Vanilla Reactive HPA** (Baseline floor)
2. **Linear Regression (OLS)** (Constant velocity extrapolation)
3. **Holt-Winters Triple Exponential Smoothing** (Diurnal 24h seasonal periodicity)
4. **2-Layer LSTM Recurrent Neural Network** (Non-linear curvature preemption & surge detection)

---

## 👨‍💻 Research & Authorship

- **Lead Researcher & Author**: **Gagan Singh**
- **Academic Institution**: **ABES Engineering College**
- **GitHub Profile**: [github.com/gagansingh0805](https://github.com/gagansingh0805)

---

## 📁 Repository Structure

```
PHPA/
├── dashboard/
│   ├── frontend/            # High-aesthetic React + Tailwind + Framer Motion research dashboard
│   │   ├── src/
│   │   │   ├── components/  # Bento cards, PodCluster, ReplicasChart, LiveEventLog, Throttle, etc.
│   │   │   └── App.jsx      # Standalone browser telemetry simulation engine
│   └── backend/             # Python HTTP & SSE telemetry streaming backend
└── predictive-horizontal-pod-autoscaler/
    ├── api/v1alpha1/        # Go Kubernetes CRD definitions (PredictiveHorizontalPodAutoscaler)
    ├── algorithms/          # Statistical & ML prediction algorithms (Linear, Holt-Winters, LSTM)
    ├── internal/            # Kubernetes operator reconciliation and scale decision engines
    └── helm/                # Helm deployment charts for Kubernetes clusters
```

---

## 🚀 Getting Started

### 1. Launching the Interactive Frontend Showcase
The interactive dashboard runs independently with embedded real-time simulation:

```bash
cd dashboard/frontend
npm install
npm run dev -- --port 3000
```
Open **`http://localhost:3000`** in your browser.

### Key Showcase Capabilities:
- **Interactive Playback**: 1x to 120x fast-forward simulation of 5-day traffic traces.
- **💥 Flash Crowd Burst Injector**: Trigger a 5x sudden traffic surge to compare how LSTM preempts the load while Reactive HPA lags.
- **Manual Load Throttle**: Toggle between automated diurnal traffic traces and real-time user-controlled RPS slider (15–600 RPS).
- **Live Terminal Telemetry Log**: Streaming event ledger detailing LSTM lead time, HPA deficits, and cluster scaling decisions.
- **Animated Pod Cluster**: Visual server pod grid rendering instances scaling in and out in real time with spring physics.
