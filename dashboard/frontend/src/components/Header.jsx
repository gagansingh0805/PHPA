import React from 'react';
import { Activity, Clock, Zap } from 'lucide-react';

export default function Header({ simTime, speedFactor, isConnected, isSpiking }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Predictive HPA
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
              Research Showcase
            </span>
          </h1>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Real-time proactive autoscaling evaluation (Vanilla HPA vs. Linear vs. Holt-Winters vs. LSTM)
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* Flash crowd alert badge */}
        {isSpiking && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            SURGE IN PROGRESS
          </div>
        )}

        {/* Connection Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
          {isConnected ? 'LIVE TELEMETRY' : 'RECONNECTING'}
        </div>

        {/* Virtual Simulation Clock */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{simTime || 'Day 1, 00:00:00'}</span>
          <span className="text-purple-400 font-bold ml-1">({speedFactor}x)</span>
        </div>
      </div>
    </header>
  );
}

