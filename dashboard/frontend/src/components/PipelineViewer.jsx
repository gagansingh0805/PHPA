import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Layers, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PipelineViewer() {
  const [selectedStage, setSelectedStage] = useState(3);

  const stages = [
    {
      id: 0,
      title: '1. Traffic Ingestion',
      icon: Activity,
      summary: 'Clients fire HTTP requests at the ingress gateway.',
      detail: 'The incoming traffic rate fluctuates dynamically based on diurnal human cycles or sudden bursts.',
    },
    {
      id: 1,
      title: '2. Target Workload',
      icon: Server,
      summary: 'Kubernetes deployment pods process requests.',
      detail: 'Each pod consumes CPU proportionally to its load. CPU target is configured at 60% per pod.',
    },
    {
      id: 2,
      title: '3. Metric Gatherer',
      icon: Layers,
      summary: 'k8shorizmetrics polls pod resource metrics.',
      detail: 'Gathers CPU/Memory metrics, filters unready pods, and computes the raw baseline replica count.',
    },
    {
      id: 3,
      title: '4. Model Dispatcher',
      icon: Cpu,
      summary: 'Executes Linear, Holt-Winters, and LSTM in parallel.',
      detail: 'Pipes accumulated replica history to Python statistical scripts and PyTorch LSTM to generate forward predictions.',
    },
    {
      id: 4,
      title: '5. Decision & Scale',
      icon: CheckCircle2,
      summary: 'Applies Decision Strategy & ScaleClient updates.',
      detail: 'Picks upper bound (DecisionType: Maximum), enforces stabilization windows and scaling limits, and patches the deployment.',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">PHPA Architectural Pipeline</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Click on any stage below to inspect how data and scaling decisions flow through the operator
        </p>
      </div>

      {/* Pipeline Stages Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`bento-card rounded-xl p-4 text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-500/15'
                  : 'hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{stage.title}</h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2">{stage.summary}</p>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <motion.div
        key={selectedStage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card rounded-xl p-6 border-purple-500/30 bg-gradient-to-r from-purple-950/10 via-zinc-900 to-zinc-900"
      >
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span>Stage Detail Inspection</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{stages[selectedStage].title}</h3>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">{stages[selectedStage].detail}</p>
      </motion.div>
    </div>
  );
}
