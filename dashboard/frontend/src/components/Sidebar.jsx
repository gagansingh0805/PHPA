import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart2, 
  Terminal, 
  BookOpen, 
  GitBranch, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Activity, 
  Clock,
  ChevronRight
} from 'lucide-react';
import Term from './Term';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isPlaying,
  speedFactor,
  onTogglePlay,
  onSpeedChange,
  onInjectSpike,
  onReset,
  simTime,
  isSpiking
}) {
  const navItems = [
    { id: 'lab', label: 'Telemetry Lab', desc: 'Real-time charts & pod cluster', icon: LayoutDashboard },
    { id: 'benchmark', label: 'Model Benchmarking', desc: 'Side-by-side cost & accuracy', icon: BarChart2 },
    { id: 'logs', label: 'Decision Log Feed', desc: 'Live autoscaler event stream', icon: Terminal },
    { id: 'models', label: 'Mathematical Theory', desc: 'Formulations & equations', icon: BookOpen },
    { id: 'pipeline', label: 'Pipeline Architecture', desc: 'Kubernetes CRD & controller', icon: GitBranch },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 select-none z-30">
      {/* Top Branding */}
      <div>
        <div className="p-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-md shadow-purple-500/20 flex-shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight truncate">
                  Predictive <Term id="hpa">HPA</Term>
                </h1>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  v0.13.2
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">Autoscaling Research Testbed</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-purple-600/15 border border-purple-500/30 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                  <div className="truncate">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                      {item.label}
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">{item.desc}</div>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Integrated Simulation Controller */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
        {/* Simulation Clock & State */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="truncate">{simTime || 'Day 1, 00:00:00'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className={isPlaying ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {isPlaying ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Primary Controls: Play/Pause, Reset, Speed */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            title="Reset simulation to t=0"
            className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center justify-between bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[10px] font-mono">
          <span className="text-zinc-500 px-1 font-sans">Speed:</span>
          {[1, 10, 60].map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 rounded transition-all ${
                speedFactor === spd
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Flash Crowd Surge Trigger */}
        <button
          onClick={onInjectSpike}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
            isSpiking
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
              : 'bg-gradient-to-r from-rose-950/50 via-rose-900/30 to-zinc-900 border border-rose-500/40 text-rose-300 hover:border-rose-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>{isSpiking ? 'SURGE ACTIVE (5x)' : 'Inject 5x Flash Crowd'}</span>
        </button>
      </div>
    </aside>
  );
}
