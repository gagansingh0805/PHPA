import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  Filter, 
  BrainCircuit, 
  ShieldAlert, 
  DollarSign, 
  Server, 
  Zap, 
  CheckCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

export default function LiveEventLog({ logs = [], onClear }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'LSTM' | 'SCALE' | 'COST' | 'SURGE'
  const [viewMode, setViewMode] = useState('story'); // 'story' | 'compact'
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom of log stream
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'LSTM') return log.level === 'LSTM' || log.category === 'insight';
    if (filter === 'SCALE') return log.level === 'SCALE' || log.category === 'scale';
    if (filter === 'COST') return log.level === 'COST' || log.category === 'cost';
    if (filter === 'SURGE') return log.level === 'SURGE' || log.level === 'HPA' || log.category === 'alert';
    return true;
  });

  return (
    <div className="bento-card rounded-xl p-3.5 border border-zinc-800/90 font-sans text-xs bg-zinc-950/90">
      {/* Title Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {/* macOS window buttons */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-zinc-200 font-bold text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Autoscaling Decision & Telemetry Stream</span>
          </div>
        </div>

        {/* View Toggle & Clear Button */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Mode Switcher: Story vs Compact */}
          <div className="flex items-center bg-zinc-900 rounded-md border border-zinc-800 p-0.5 text-[10px]">
            <button
              onClick={() => setViewMode('story')}
              className={`px-2 py-0.5 rounded transition-all ${
                viewMode === 'story'
                  ? 'bg-purple-600/80 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Story Feed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2 py-0.5 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-purple-600/80 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Console
            </button>
          </div>

          <button
            onClick={onClear}
            title="Clear events"
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 text-[10px] select-none border-b border-zinc-900">
        <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider pl-0.5">Filter:</span>
        {[
          { id: 'ALL', label: `All (${logs.length})`, icon: null },
          { id: 'LSTM', label: '🧠 ML Insights', icon: BrainCircuit },
          { id: 'SCALE', label: '⚡ Pod Scaling', icon: Server },
          { id: 'COST', label: '💰 Savings & Cost', icon: DollarSign },
          { id: 'SURGE', label: '⚠️ SLA & Lag', icon: ShieldAlert },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
              filter === btn.id
                ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Event Stream Container */}
      <div
        ref={logContainerRef}
        className="h-44 overflow-y-auto space-y-1.5 pr-1 leading-relaxed selection:bg-purple-500/30 font-mono"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic py-6 text-center text-xs font-sans">
            No events match the selected filter. Events trigger when traffic moves, models predict, or scaling occurs.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            // Determine styling & icon based on level
            let badgeBg = 'bg-zinc-800/80 text-zinc-300';
            let badgeBorder = 'border-zinc-700';
            let cardGlow = 'border-zinc-800/60 bg-zinc-900/40';
            let Icon = Server;
            let iconColor = 'text-zinc-400';

            if (log.level === 'LSTM') {
              badgeBg = 'bg-purple-950/80 text-purple-300';
              badgeBorder = 'border-purple-500/50';
              cardGlow = 'border-purple-500/30 bg-purple-950/20';
              Icon = BrainCircuit;
              iconColor = 'text-purple-400';
            } else if (log.level === 'HPA') {
              badgeBg = 'bg-amber-950/80 text-amber-300';
              badgeBorder = 'border-amber-500/50';
              cardGlow = 'border-amber-500/30 bg-amber-950/20';
              Icon = ShieldAlert;
              iconColor = 'text-amber-400';
            } else if (log.level === 'SURGE') {
              badgeBg = 'bg-rose-950/80 text-rose-300';
              badgeBorder = 'border-rose-500/50';
              cardGlow = 'border-rose-500/30 bg-rose-950/20';
              Icon = Zap;
              iconColor = 'text-rose-400';
            } else if (log.level === 'SCALE') {
              badgeBg = 'bg-cyan-950/80 text-cyan-300';
              badgeBorder = 'border-cyan-500/50';
              cardGlow = 'border-cyan-500/30 bg-cyan-950/20';
              Icon = Server;
              iconColor = 'text-cyan-400';
            } else if (log.level === 'COST') {
              badgeBg = 'bg-emerald-950/80 text-emerald-300';
              badgeBorder = 'border-emerald-500/50';
              cardGlow = 'border-emerald-500/30 bg-emerald-950/20';
              Icon = DollarSign;
              iconColor = 'text-emerald-400';
            }

            if (viewMode === 'compact') {
              // Compact terminal row
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 hover:bg-zinc-900/80 px-1 py-0.5 rounded transition-colors text-[11px]"
                >
                  <span className="text-zinc-500 text-[10px] select-none min-w-[55px] pt-0.5">{log.time}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${badgeBg} ${badgeBorder} select-none min-w-[55px] text-center`}
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-300 flex-1">{log.message}</span>
                </div>
              );
            }

            // Rich Story Card View (High readability!)
            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border ${cardGlow} hover:border-zinc-600/60 transition-all flex items-start gap-2 text-xs font-sans`}
              >
                <div className="p-1 rounded-md bg-zinc-950 border border-zinc-800 mt-0.5">
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-mono font-bold ${badgeBg} ${badgeBorder}`}>
                      {log.level}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{log.time}</span>
                  </div>
                  <div className="text-zinc-200 text-[11px] leading-snug">
                    {log.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
