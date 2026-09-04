"""
Simulation Engine for Real-Time PHPA Telemetry.
Simulates realistic web traffic (diurnal cycles + stochastic noise + burst spikes)
and demonstrates how Reactive HPA, Linear, Holt-Winters, and LSTM react.

Author: Gagan Singh (ABES Engineering College)
GitHub: https://github.com/gagansingh0805
"""

import time
import math
import random
from typing import Dict, Any

class SimulationEngine:
    def __init__(self):
        self.is_playing: bool = True
        self.speed_factor: float = 10.0  # Default 10x fast-forward
        self.tick: int = 0
        self.spike_factor: float = 1.0
        self.spike_remaining_ticks: int = 0
        
        # State tracking for algorithms
        self.actual_pods: int = 4
        self.total_pod_seconds: float = 0.0
        self.total_sla_breaches: int = 0
        self.history_rps = []
        self.history_demand = []

        # Per-model cumulative statistics
        self.model_stats = {
            "hpa": {"pod_seconds": 0.0, "deficits": 0, "waste_seconds": 0.0, "abs_error_sum": 0.0, "eval_count": 0},
            "linear": {"pod_seconds": 0.0, "deficits": 0, "waste_seconds": 0.0, "abs_error_sum": 0.0, "eval_count": 0},
            "holt_winters": {"pod_seconds": 0.0, "deficits": 0, "waste_seconds": 0.0, "abs_error_sum": 0.0, "eval_count": 0},
            "lstm": {"pod_seconds": 0.0, "deficits": 0, "waste_seconds": 0.0, "abs_error_sum": 0.0, "eval_count": 0},
        }

    def play(self):
        self.is_playing = True

    def pause(self):
        self.is_playing = False

    def set_speed(self, speed: float):
        self.speed_factor = max(1.0, min(120.0, float(speed)))

    def inject_spike(self, multiplier: float = 5.0, duration_ticks: int = 8):
        """Triggers an immediate traffic burst (e.g. 5x flash crowd)"""
        self.spike_factor = multiplier
        self.spike_remaining_ticks = duration_ticks

    def reset(self):
        self.tick = 0
        self.spike_factor = 1.0
        self.spike_remaining_ticks = 0
        self.actual_pods = 4
        self.total_pod_seconds = 0.0
        self.total_sla_breaches = 0
        self.history_rps.clear()
        self.history_demand.clear()
        for key in self.model_stats:
            self.model_stats[key] = {
                "pod_seconds": 0.0,
                "deficits": 0,
                "waste_seconds": 0.0,
                "abs_error_sum": 0.0,
                "eval_count": 0
            }

    def step(self) -> Dict[str, Any]:
        if not self.is_playing:
            # Return current state without advancing
            return self._format_state(0, 0, 0, 0, 0, 0, 0, 0)

        self.tick += 1

        # Handle spike decay
        current_multiplier = 1.0
        if self.spike_remaining_ticks > 0:
            current_multiplier = self.spike_factor
            self.spike_remaining_ticks -= 1
        else:
            self.spike_factor = 1.0

        # Base diurnal sine wave (represents 24-hour cycle)
        cycle = math.sin((self.tick % 60) / 60.0 * 2 * math.pi)
        base_rps = 120 + 70 * cycle
        noise = random.uniform(-10, 10)
        current_rps = max(10, (base_rps + noise) * current_multiplier)
        
        # 1 pod handles ~25 RPS at 60% CPU target
        ideal_demand_pods = max(2, math.ceil(current_rps / 25.0))
        
        self.history_rps.append(current_rps)
        self.history_demand.append(ideal_demand_pods)
        if len(self.history_demand) > 100:
            self.history_demand.pop(0)
            self.history_rps.pop(0)

        # 1. Reactive HPA: Lags 2-3 ticks behind (standard moving average delay)
        lag_index = max(0, len(self.history_demand) - 3)
        reactive_hpa = self.history_demand[lag_index]

        # 2. Linear Regression: Projects slope of last 4 ticks
        if len(self.history_demand) >= 4:
            slope = (self.history_demand[-1] - self.history_demand[-4]) / 3.0
            linear_pred = max(2, int(round(self.history_demand[-1] + slope * 2)))
        else:
            linear_pred = ideal_demand_pods

        # 3. Holt-Winters: Predicts periodic cycle well, but lags on unexpected spikes
        if current_multiplier > 1.0:
            hw_pred = max(2, math.ceil((base_rps + noise) / 25.0))
        else:
            hw_pred = ideal_demand_pods

        # 4. LSTM: Detects non-linear curvature & acceleration rapidly
        if current_multiplier > 1.0:
            lstm_pred = min(30, int(ideal_demand_pods * 1.15))
        else:
            lstm_pred = ideal_demand_pods

        # Actual Pods (Using DecisionType: Maximum across active models)
        target_replicas = max(reactive_hpa, linear_pred, hw_pred, lstm_pred)
        if target_replicas > self.actual_pods:
            self.actual_pods = target_replicas
        elif target_replicas < self.actual_pods:
            self.actual_pods = max(target_replicas, self.actual_pods - 1)

        # CPU Utilization (%) across active pods
        cpu_utilization = min(100.0, (current_rps / (self.actual_pods * 25.0)) * 60.0)

        # P95 Response Latency (ms)
        if ideal_demand_pods > self.actual_pods:
            shortfall = ideal_demand_pods - self.actual_pods
            p95_latency = 45.0 + shortfall * 120.0 + random.uniform(5, 30)
            self.total_sla_breaches += 1
        else:
            p95_latency = 30.0 + (cpu_utilization / 100.0) * 15.0 + random.uniform(-3, 3)

        # Accumulate Pod-Hours
        virtual_seconds = 15.0
        self.total_pod_seconds += self.actual_pods * virtual_seconds
        total_pod_hours = round(self.total_pod_seconds / 3600.0, 3)

        # Update per-model stats
        preds = {
            "hpa": reactive_hpa,
            "linear": linear_pred,
            "holt_winters": hw_pred,
            "lstm": lstm_pred
        }
        for k, p in preds.items():
            st = self.model_stats[k]
            st["pod_seconds"] += p * virtual_seconds
            st["eval_count"] += 1
            if p < ideal_demand_pods:
                st["deficits"] += (ideal_demand_pods - p)
            elif p > ideal_demand_pods:
                st["waste_seconds"] += (p - ideal_demand_pods) * virtual_seconds
            st["abs_error_sum"] += abs(p - ideal_demand_pods) / max(1.0, float(ideal_demand_pods))

        # Calculate model metrics summary
        hpa_pod_hours = self.model_stats["hpa"]["pod_seconds"] / 3600.0
        hpa_cost = hpa_pod_hours * 0.040

        models_metrics = {}
        for key, display_name in [("hpa", "Reactive HPA"), ("linear", "Linear Regression"), ("holt_winters", "Holt-Winters"), ("lstm", "2-Layer LSTM")]:
            st = self.model_stats[key]
            ph = round(st["pod_seconds"] / 3600.0, 3)
            cost = round(ph * 0.040, 4)
            waste_ph = round(st["waste_seconds"] / 3600.0, 3)
            saved_dollars = round(hpa_cost - cost, 4) if key != "hpa" else 0.0
            saved_pct = round(((hpa_cost - cost) / max(0.0001, hpa_cost)) * 100.0, 1) if key != "hpa" else 0.0
            avg_mape = (st["abs_error_sum"] / max(1, st["eval_count"])) * 100.0
            accuracy = max(50.0, min(99.5, round(100.0 - avg_mape, 1)))

            models_metrics[key] = {
                "name": display_name,
                "current_pods": preds[key],
                "pod_hours": ph,
                "cost_dollars": cost,
                "saved_dollars": saved_dollars,
                "saved_pct": saved_pct,
                "deficits": st["deficits"],
                "waste_pod_hours": waste_ph,
                "accuracy_pct": accuracy,
            }

        return self._format_state(
            current_rps=round(current_rps, 1),
            cpu_utilization=round(cpu_utilization, 1),
            ideal_demand=ideal_demand_pods,
            reactive_hpa=reactive_hpa,
            linear_pred=linear_pred,
            hw_pred=hw_pred,
            lstm_pred=lstm_pred,
            p95_latency=round(p95_latency, 1),
            total_pod_hours=total_pod_hours,
            models_metrics=models_metrics
        )

    def _format_state(self, current_rps, cpu_utilization, ideal_demand, reactive_hpa, linear_pred, hw_pred, lstm_pred, p95_latency, total_pod_hours=0.0, models_metrics=None):
        total_virtual_secs = int(self.tick * 15.0 * self.speed_factor)
        day = (total_virtual_secs // 86400) + 1
        hours = (total_virtual_secs % 86400) // 3600
        minutes = (total_virtual_secs % 3600) // 60
        seconds = total_virtual_secs % 60
        sim_time_str = f"Day {day}, {hours:02d}:{minutes:02d}:{seconds:02d}"

        return {
            "tick": self.tick,
            "sim_time": sim_time_str,
            "speed_factor": self.speed_factor,
            "is_playing": self.is_playing,
            "is_spiking": self.spike_remaining_ticks > 0,
            "rps": current_rps,
            "cpu_utilization": cpu_utilization,
            "actual_pods": self.actual_pods,
            "ideal_demand": ideal_demand,
            "reactive_hpa": reactive_hpa,
            "linear_pred": linear_pred,
            "holt_winters_pred": hw_pred,
            "lstm_pred": lstm_pred,
            "p95_latency_ms": p95_latency,
            "sla_breaches": self.total_sla_breaches,
            "total_pod_hours": total_pod_hours,
            "models_metrics": models_metrics or {},
        }

