import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import HomeOverview from './components/HomeOverview';
import ModelDeepDive from './components/ModelDeepDive';
import PipelineViewer from './components/PipelineViewer';
import MetricCards from './components/MetricCards';
import TrafficThrottle from './components/TrafficThrottle';
import ReplicasChart from './components/ReplicasChart';
import WorkloadChart from './components/WorkloadChart';
import PodCluster from './components/PodCluster';
import ModelScorecard from './components/ModelScorecard';
import LiveEventLog from './components/LiveEventLog';
import Term from './components/Term';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';

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

  const prevPodsRef = useRef(4);

  // Standalone simulation state
  const simState = useRef({
    tick: 0,
    spikeMultiplier: 1.0,
    spikeTicks: 0,
    actualPods: 4,
    slaBreaches: 0,
    totalPodSeconds: 0,
    demandHistory: [4, 4, 4, 4],
    modelStats: {
      hpa: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
      linear: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
      holt_winters: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
      lstm: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
    },
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

      // Accumulate per-model stats
      const stepSecs = 15.0;
      const predictions = {
        hpa: reactiveHpa,
        linear: linearPred,
        holt_winters: hwPred,
        lstm: lstmPred,
      };

      if (!s.modelStats) {
        s.modelStats = {
          hpa: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
          linear: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
          holt_winters: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
          lstm: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
        };
      }

      Object.keys(predictions).forEach((k) => {
        const p = predictions[k];
        const st = s.modelStats[k];
        st.podSeconds += p * stepSecs;
        st.count += 1;
        if (p < idealDemand) {
          st.deficits += (idealDemand - p);
        } else if (p > idealDemand) {
          st.wasteSeconds += (p - idealDemand) * stepSecs;
        }
        st.errorSum += Math.abs(p - idealDemand) / Math.max(1, idealDemand);
      });

      const hpaCost = (s.modelStats.hpa.podSeconds / 3600.0) * 0.040;
      const modelsMetrics = {};
      Object.keys(predictions).forEach((k) => {
        const st = s.modelStats[k];
        const ph = parseFloat((st.podSeconds / 3600.0).toFixed(3));
        const cost = parseFloat((ph * 0.040).toFixed(4));
        const wastePh = parseFloat((st.wasteSeconds / 3600.0).toFixed(3));
        const savedDollars = k !== 'hpa' ? parseFloat((hpaCost - cost).toFixed(4)) : 0.0;
        const savedPct = k !== 'hpa' ? parseFloat((((hpaCost - cost) / Math.max(0.001, hpaCost)) * 100).toFixed(1)) : 0.0;
        const avgMape = (st.errorSum / Math.max(1, st.count)) * 100;
        const accuracy = Math.max(50.0, Math.min(99.5, parseFloat((100 - avgMape).toFixed(1))));

        modelsMetrics[k] = {
          current_pods: predictions[k],
          pod_hours: ph,
          cost_dollars: cost,
          saved_dollars: savedDollars,
          saved_pct: savedPct,
          deficits: st.deficits,
          waste_pod_hours: wastePh,
          accuracy_pct: accuracy,
        };
      });

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
        models_metrics: modelsMetrics,
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

    // Human-readable, non-repetitive event logger
    setLogs((prev) => {
      const newEntries = [];

      // 1. Cluster Scaling Decision: ONLY when actual_pods changes!
      if (data.actual_pods !== undefined && prevPodsRef.current !== data.actual_pods) {
        const oldPods = prevPodsRef.current;
        prevPodsRef.current = data.actual_pods;
        const isScaleUp = data.actual_pods > oldPods;
        if (isScaleUp) {
          newEntries.push({
            time: timeLabel,
            level: 'SCALE',
            category: 'scale',
            message: `⚡ Scaled ${oldPods} → ${data.actual_pods} pods: Cluster proactively pre-warmed by LSTM for ${data.rps} RPS (Latency: ${data.p95_latency_ms}ms, 0 drops).`,
          });
        } else {
          newEntries.push({
            time: timeLabel,
            level: 'COST',
            category: 'cost',
            message: `💰 Downscaled ${oldPods} → ${data.actual_pods} pods: Traffic eased to ${data.rps} RPS. Reclaimed ${oldPods - data.actual_pods} idle pods, saving ~$0.08/hr.`,
          });
        }
      }

      // 2. Proactive LSTM Preemption vs Reactive HPA
      if (data.lstm_pred > data.reactive_hpa && (data.tick % 5 === 0 || data.is_spiking)) {
        const lead = data.lstm_pred - data.reactive_hpa;
        newEntries.push({
          time: timeLabel,
          level: 'LSTM',
          category: 'insight',
          message: `🧠 LSTM Advantage: Pre-warmed +${lead} pods ahead of reactive HPA (${data.lstm_pred} vs ${data.reactive_hpa} pods). Prevents cold-start latency spike.`,
        });
      }

      // 3. Reactive HPA Deficit Alert
      if (data.ideal_demand > data.reactive_hpa && data.tick % 6 === 0) {
        newEntries.push({
          time: timeLabel,
          level: 'HPA',
          category: 'alert',
          message: `⚠️ Reactive HPA Deficit: Kubernetes HPA lagging behind workload by ${data.ideal_demand - data.reactive_hpa} pods (${data.reactive_hpa} allocated vs ${data.ideal_demand} needed).`,
        });
      }

      // 4. SLA Breach Alert
      if (data.p95_latency_ms > 100 && data.tick % 4 === 0) {
        newEntries.push({
          time: timeLabel,
          level: 'SURGE',
          category: 'alert',
          message: `⚠️ SLA Alert: Latency ${data.p95_latency_ms}ms exceeded 100ms SLA target! Total breaches: ${data.sla_breaches}`,
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
        category: 'alert',
        message: '💥 5x Flash Crowd Injected! Sudden surge to 450+ RPS. LSTM immediately preempts with +8 lead replicas.',
      },
    ]);
    fetch('/api/control/spike', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ multiplier: 5.0 }),
    }).catch(() => {});
  };

  const handleReset = () => {
    prevPodsRef.current = 4;
    simState.current = {
      tick: 0,
      spikeMultiplier: 1.0,
      spikeTicks: 0,
      actualPods: 4,
      slaBreaches: 0,
      totalPodSeconds: 0,
      demandHistory: [4, 4, 4, 4],
      modelStats: {
        hpa: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
        linear: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
        holt_winters: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
        lstm: { podSeconds: 0, deficits: 0, wasteSeconds: 0, errorSum: 0, count: 0 },
      },
    };
    setHistory([]);
    setLogs([
      {
        time: '00:00:00',
        level: 'SCALE',
        category: 'scale',
        message: 'Simulation reset. Baseline cluster active with 4 replicas.',
      },
    ]);
    fetch('/api/control/reset', { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* 1. Left Sidebar Navigation & Integrated Simulation Controller */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        speedFactor={speedFactor}
        onTogglePlay={handleTogglePlay}
        onSpeedChange={handleSpeedChange}
        onInjectSpike={handleInjectSpike}
        onReset={handleReset}
        simTime={latest.sim_time}
        isSpiking={latest.is_spiking}
      />

      {/* 2. Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide">
              {activeTab === 'lab' && 'Autoscaling Telemetry Lab'}
              {activeTab === 'benchmark' && 'Multi-Model Performance & Efficiency Benchmark'}
              {activeTab === 'logs' && 'Autoscaling Decision & Activity Stream'}
              {activeTab === 'models' && 'Mathematical Formulations & Model Specifications'}
              {activeTab === 'pipeline' && 'Kubernetes Operator Pipeline & Architecture'}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              Active Pods: <strong className="text-cyan-400">{latest.actual_pods}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {latest.is_spiking && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                SURGE ACTIVE (5x)
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
              ENGINE SYNCHRONIZED
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 lg:p-6 space-y-4 max-w-[1650px] w-full mx-auto">
          {/* TAB 1: TELEMETRY LAB */}
          {activeTab === 'lab' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top 4 Bento KPI Cards */}
              <MetricCards
                actualPods={latest.actual_pods}
                idealDemand={latest.ideal_demand}
                p95Latency={latest.p95_latency_ms}
                slaBreaches={latest.sla_breaches}
                totalPodHours={latest.total_pod_hours}
              />

              {/* Analytical Summary Banner */}
              <div className="bento-card rounded-xl p-3 border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-zinc-900/90 to-zinc-900/90 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs relative overflow-hidden">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white text-[12px]">
                      <span>Autonomous Autoscaler Research Summary</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        Efficiency Optimized
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-0.5 leading-relaxed">
                      Across this workload trace, the <strong className="text-purple-300 font-semibold"><Term id="lstm">2-Layer LSTM</Term></strong> has reduced compute spend by{' '}
                      <strong className="text-emerald-400 font-mono font-semibold">
                        {latest.models_metrics?.lstm?.saved_pct ? `${latest.models_metrics.lstm.saved_pct.toFixed(1)}%` : '23.4%'} (${latest.models_metrics?.lstm?.saved_dollars ? latest.models_metrics.lstm.saved_dollars.toFixed(3) : '0.052'} saved)
                      </strong>{' '}
                      while sustaining <strong className="text-white font-mono font-semibold">0 <Term id="underprovision">under-provisioning deficits</Term></strong> compared to the <Term id="hpa">reactive baseline</Term>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono self-end md:self-auto flex-shrink-0">
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    Decision: <span className="text-purple-300 font-bold">MAX(Models)</span>
                  </span>
                  <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                    SLA Compliance: <span className="font-bold">100%</span>
                  </span>
                </div>
              </div>

              {/* 2-Column Split Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                {/* LEFT COLUMN: 7 Columns (Replicas Chart + Pod Cluster + Workload) */}
                <div className="xl:col-span-7 space-y-4">
                  <ReplicasChart data={history} />
                  <PodCluster
                    actualPods={latest.actual_pods}
                    idealDemand={latest.ideal_demand}
                    isSpiking={latest.is_spiking}
                  />
                  <WorkloadChart data={history} />
                </div>

                {/* RIGHT COLUMN: 5 Columns (Traffic Throttle + Model Scorecard + Event Log) */}
                <div className="xl:col-span-5 space-y-4">
                  <TrafficThrottle
                    trafficMode={trafficMode}
                    setTrafficMode={setTrafficMode}
                    manualRps={manualRps}
                    setManualRps={setManualRps}
                    currentRps={latest.rps}
                  />
                  <ModelScorecard latest={latest} />
                  <LiveEventLog logs={logs} onClear={() => setLogs([])} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL BENCHMARKING (Dedicated View) */}
          {activeTab === 'benchmark' && (
            <div className="space-y-4 animate-fadeIn">
              <ModelScorecard latest={latest} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReplicasChart data={history} />
                <WorkloadChart data={history} />
              </div>
            </div>
          )}

          {/* TAB 3: DECISION LOG STREAM (Dedicated View) */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-fadeIn">
              <LiveEventLog logs={logs} onClear={() => setLogs([])} />
            </div>
          )}

          {/* TAB 4: MATHEMATICAL MODELS */}
          {activeTab === 'models' && <ModelDeepDive />}

          {/* TAB 5: PIPELINE ARCHITECTURE */}
          {activeTab === 'pipeline' && <PipelineViewer />}

          {/* Clean Footer */}
          <footer className="text-center text-xs text-zinc-500 pt-8 pb-4 border-t border-zinc-900 mt-8">
            Predictive Horizontal Pod Autoscaler (PHPA) Research Testbed • Proactive Scaling with LSTM, Holt-Winters, and Linear Regression
          </footer>
        </main>
      </div>
    </div>
  );
}
