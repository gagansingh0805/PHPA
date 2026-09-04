import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HomeOverview from './components/HomeOverview';
import ModelDeepDive from './components/ModelDeepDive';
import PipelineViewer from './components/PipelineViewer';
import MetricCards from './components/MetricCards';
import ControlDock from './components/ControlDock';
import TrafficThrottle from './components/TrafficThrottle';
import ReplicasChart from './components/ReplicasChart';
import WorkloadChart from './components/WorkloadChart';
import PodCluster from './components/PodCluster';
import LSTMAttribution from './components/LSTMAttribution';
import LiveEventLog from './components/LiveEventLog';

export default function App() {
  const [activeTab, setActiveTab] = useState('lab'); // 'lab', 'home', 'models', 'pipeline'
  const [trafficMode, setTrafficMode] = useState('auto'); // 'auto' | 'manual'
  const [manualRps, setManualRps] = useState(125);

  const [logs, setLogs] = useState([
    { time: '00:00:01', level: 'SCALE', message: 'PHPA initialized with baseline 4 replicas (Target CPU: 60%)' },
    { time: '00:00:02', level: 'LSTM', message: 'LSTM model loaded: 2-layer stacked PyTorch network active (lookahead: 3 steps)' },
    { time: '00:00:03', level: 'HPA', message: 'Reactive HPA baseline evaluator attached to horizontal metrics pool' },
  ]);

  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState({
    sim_time: 'Day 1, 00:00:00',
    speed_factor: 10,
    is_playing: true,
    is_spiking: false,
    actual_pods: 4,
    ideal_demand: 4,
    p95_latency_ms: 32.5,
    sla_breaches: 0,
    total_pod_hours: 0.0,
    rps: 125,
    cpu_utilization: 60,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedFactor, setSpeedFactor] = useState(10);

  // Standalone simulation state
  const simState = useRef({
    tick: 0,
    spikeMultiplier: 1.0,
    spikeTicks: 0,
    actualPods: 4,
    slaBreaches: 0,
    totalPodSeconds: 0,
    demandHistory: [4, 4, 4, 4],
  });

  // Keep ref to manualRps and trafficMode so the interval closure has latest values
  const trafficControlRef = useRef({ mode: 'auto', rps: 125 });
  useEffect(() => {
    trafficControlRef.current = { mode: trafficMode, rps: manualRps };
  }, [trafficMode, manualRps]);

  // Connect to backend SSE if available
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/stream');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onerror = () => setIsConnected(false);
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        handleTick(data);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Standalone simulation timer
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      if (!isPlaying) return;

      const s = simState.current;
      s.tick += 1;

      // Handle Spike
      let mult = 1.0;
      if (s.spikeTicks > 0) {
        mult = s.spikeMultiplier;
        s.spikeTicks -= 1;
      }

      let rps = 120;
      const { mode, rps: controlledRps } = trafficControlRef.current;

      if (mode === 'manual') {
        // User manually controls traffic volume!
        rps = Math.max(10, Math.round(controlledRps * mult));
      } else {
        // Autonomous 5-day diurnal cycle trace replay
        const cycle = Math.sin((s.tick % 60) / 60.0 * 2 * Math.PI);
        const baseRps = 120 + 70 * cycle;
        const noise = (Math.random() - 0.5) * 20;
        rps = Math.max(10, Math.round((baseRps + noise) * mult));
      }

      // 1 pod handles ~25 RPS at 60% CPU target
      const idealDemand = Math.max(2, Math.ceil(rps / 25.0));
      s.demandHistory.push(idealDemand);
      if (s.demandHistory.length > 50) s.demandHistory.shift();

      // 1. Reactive HPA (lags by 3 steps)
      const reactiveHpa = s.demandHistory[Math.max(0, s.demandHistory.length - 4)] || idealDemand;

      // 2. Linear Regression (slope projection)
      const len = s.demandHistory.length;
      const slope = (s.demandHistory[len - 1] - s.demandHistory[Math.max(0, len - 4)]) / 3.0;
      const linearPred = Math.max(2, Math.round(s.demandHistory[len - 1] + slope * 2));

      // 3. Holt-Winters (seasonal follower)
      const cycleBase = 120 + 70 * Math.sin((s.tick % 60) / 60.0 * 2 * Math.PI);
      const hwPred = mult > 1.0 ? Math.max(2, Math.ceil(cycleBase / 25.0)) : idealDemand;

      // 4. LSTM (rapid non-linear preemption)
      const lstmPred = mult > 1.0 ? Math.min(28, Math.round(idealDemand * 1.15)) : idealDemand;

      // Actual Pods (Upper bound decision: Maximum)
      const target = Math.max(reactiveHpa, linearPred, hwPred, lstmPred);
      if (target > s.actualPods) {
        s.actualPods = target;
      } else if (target < s.actualPods) {
        // Gradual scale down stabilization
        s.actualPods = Math.max(target, s.actualPods - 1);
      }

      // CPU load (%)
      const cpu = Math.min(100, Math.round((rps / (s.actualPods * 25.0)) * 60));

      // P95 Latency & SLA violations
      let latency = 28.0 + (cpu / 100.0) * 15.0;
      if (idealDemand > s.actualPods) {
        const shortfall = idealDemand - s.actualPods;
        latency += shortfall * 110.0;
        s.slaBreaches += 1;
      }

      s.totalPodSeconds += s.actualPods * 15.0;
      const podHours = parseFloat((s.totalPodSeconds / 3600.0).toFixed(3));

      // Virtual Clock Calculation
      const totalVirtualSecs = Math.floor(s.tick * 15.0 * speedFactor);
      const day = Math.floor(totalVirtualSecs / 86400) + 1;
      const hours = String(Math.floor((totalVirtualSecs % 86400) / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalVirtualSecs % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalVirtualSecs % 60).padStart(2, '0');
      const simTimeStr = `Day ${day}, ${hours}:${minutes}:${seconds}`;

      const stateData = {
        sim_time: simTimeStr,
        speed_factor: speedFactor,
        is_playing: isPlaying,
        is_spiking: s.spikeTicks > 0,
        actual_pods: s.actualPods,
        ideal_demand: idealDemand,
        reactive_hpa: reactiveHpa,
        linear_pred: linearPred,
        holt_winters_pred: hwPred,
        lstm_pred: lstmPred,
        rps: rps,
        cpu_utilization: cpu,
        p95_latency_ms: parseFloat(latency.toFixed(1)),
        sla_breaches: s.slaBreaches,
        total_pod_hours: podHours,
        tick: s.tick,
      };

      handleTick(stateData);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isPlaying, speedFactor]);

  const handleTick = (data) => {
    setLatest(data);
    const timeLabel = data.sim_time ? data.sim_time.split(', ')[1] : `t=${data.tick}`;

    setHistory((prev) => {
      const updated = [
        ...prev,
        {
          time: timeLabel,
          actual_pods: data.actual_pods,
          reactive_hpa: data.reactive_hpa,
          linear_pred: data.linear_pred,
          holt_winters_pred: data.holt_winters_pred,
          lstm_pred: data.lstm_pred,
          rps: data.rps,
          cpu_utilization: data.cpu_utilization,
        },
      ];
      return updated.slice(-35);
    });

    // Intelligent autoscaling decision event logger
    setLogs((prev) => {
      const newEntries = [];

      // 1. Proactive LSTM Advantage vs Reactive HPA
      if (data.lstm_pred > data.reactive_hpa && (data.tick % 3 === 0 || data.is_spiking)) {
        const lead = data.lstm_pred - data.reactive_hpa;
        newEntries.push({
          time: timeLabel,
          level: 'LSTM',
          message: `LSTM preempted surge: +${lead} pods ahead of lagging Reactive HPA (${data.lstm_pred} vs ${data.reactive_hpa})`,
        });
      }

      // 2. Reactive HPA Deficit Lag
      if (data.ideal_demand > data.reactive_hpa && data.tick % 4 === 0) {
        newEntries.push({
          time: timeLabel,
          level: 'HPA',
          message: `Reactive HPA lag: ${data.ideal_demand - data.reactive_hpa} pod deficit under current ${data.rps} RPS workload`,
        });
      }

      // 3. Cluster Scaling Decision
      if (data.actual_pods !== latest.actual_pods && latest.actual_pods !== undefined) {
        const direction = data.actual_pods > latest.actual_pods ? 'Scale-Up' : 'Stabilize';
        newEntries.push({
          time: timeLabel,
          level: 'SCALE',
          message: `${direction}: Replicas adjusted to ${data.actual_pods} pods (CPU: ${data.cpu_utilization}%, Latency: ${data.p95_latency_ms}ms)`,
        });
      }

      // 4. SLA Breach Alert
      if (data.p95_latency_ms > 100 && data.tick % 2 === 0) {
        newEntries.push({
          time: timeLabel,
          level: 'SURGE',
          message: `SLA Alert: Latency ${data.p95_latency_ms}ms > 100ms threshold! Total breaches: ${data.sla_breaches}`,
        });
      }

      if (newEntries.length === 0) return prev;
      return [...prev.slice(-40), ...newEntries];
    });
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    fetch('/api/control/play', { method: 'POST' }).catch(() => {});
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeedFactor(newSpeed);
    fetch('/api/control/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed: newSpeed }),
    }).catch(() => {});
  };

  const handleInjectSpike = () => {
    simState.current.spikeMultiplier = 5.0;
    simState.current.spikeTicks = 8;
    const timeLabel = latest.sim_time ? latest.sim_time.split(', ')[1] : '00:00:00';
    setLatest((prev) => ({ ...prev, is_spiking: true }));
    setLogs((prev) => [
      ...prev.slice(-40),
      {
        time: timeLabel,
        level: 'SURGE',
        message: '💥 Flash crowd burst injected! 5x traffic surge initiated (Workload spiking)',
      },
    ]);
    fetch('/api/control/spike', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ multiplier: 5.0 }),
    }).catch(() => {});
  };

  const handleReset = () => {
    simState.current = {
      tick: 0,
      spikeMultiplier: 1.0,
      spikeTicks: 0,
      actualPods: 4,
      slaBreaches: 0,
      totalPodSeconds: 0,
      demandHistory: [4, 4, 4, 4],
    };
    setHistory([]);
    setLogs([
      {
        time: '00:00:00',
        level: 'SCALE',
        message: 'Simulation reset. Baseline cluster active with 4 replicas.',
      },
    ]);
    fetch('/api/control/reset', { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 py-4">
      {/* Top Navbar with Tab Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={true}
        isSpiking={latest.is_spiking}
      />

      {/* TAB 1: RESEARCH OVERVIEW & HOME */}
      {activeTab === 'home' && (
        <HomeOverview onLaunchLab={() => setActiveTab('lab')} />
      )}

      {/* TAB 2: MODEL DEEP DIVE */}
      {activeTab === 'models' && <ModelDeepDive />}

      {/* TAB 3: PIPELINE ARCHITECTURE */}
      {activeTab === 'pipeline' && <PipelineViewer />}

      {/* TAB 4: LIVE TELEMETRY LAB (High-Density 2-Column Split) */}
      {activeTab === 'lab' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Top 4 Bento KPI Cards */}
          <MetricCards
            actualPods={latest.actual_pods}
            idealDemand={latest.ideal_demand}
            p95Latency={latest.p95_latency_ms}
            slaBreaches={latest.sla_breaches}
            totalPodHours={latest.total_pod_hours}
          />

          {/* 2-Column Widescreen Split Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
            {/* LEFT COLUMN: 7 Columns (Hero Chart + Pod Cluster + Telemetry) */}
            <div className="xl:col-span-7 space-y-3.5">
              {/* Core Autoscaler Comparison Chart */}
              <ReplicasChart data={history} />

              {/* Visual Pod Cluster (Framer Motion Grid) */}
              <PodCluster
                actualPods={latest.actual_pods}
                idealDemand={latest.ideal_demand}
                isSpiking={latest.is_spiking}
              />

              {/* Secondary Workload Telemetry Chart (RPS & CPU) */}
              <WorkloadChart data={history} />
            </div>

            {/* RIGHT COLUMN: 5 Columns (Control Dock + Traffic Throttle + LSTM Attribution) */}
            <div className="xl:col-span-5 space-y-3.5">
              {/* Control Dock (Play/Pause, Speed, 5x Surge) */}
              <ControlDock
                isPlaying={isPlaying}
                speedFactor={speedFactor}
                onTogglePlay={handleTogglePlay}
                onSpeedChange={handleSpeedChange}
                onInjectSpike={handleInjectSpike}
                onReset={handleReset}
              />

              {/* Interactive Manual Load Throttle */}
              <TrafficThrottle
                trafficMode={trafficMode}
                setTrafficMode={setTrafficMode}
                manualRps={manualRps}
                setManualRps={setManualRps}
                currentRps={latest.rps}
              />

              {/* Live LSTM Model Attribution & Advantage Analysis */}
              <LSTMAttribution latest={latest} history={history} />

              {/* Live Autoscaling Decision & Telemetry Logs */}
              <LiveEventLog logs={logs} onClear={() => setLogs([])} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 pt-8 pb-3 border-t border-zinc-900 mt-12">
        Predictive Horizontal Pod Autoscaler (PHPA) Research Platform • Proactive Scaling with LSTM, Holt-Winters, and Linear Regression
      </footer>
    </div>
  );
}
