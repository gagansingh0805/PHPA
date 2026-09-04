import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, GitBranch, Cpu, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isConnected, isSpiking }) {
  const tabs = [
    { id: 'lab', label: 'Live Telemetry Lab', icon: LayoutDashboard },
    { id: 'home', label: 'Research Overview', icon: BookOpen },
    { id: 'models', label: 'Model Deep Dive', icon: Cpu },
    { id: 'pipeline', label: 'PHPA Pipeline', icon: GitBranch },
  ];

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 mb-6">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/25">
          <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">Predictive HPA</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
              v0.13.2 + LSTM
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">IEEE/ACM Cloud Autoscaling Research Testbed</p>
        </div>
      </div>

      {/* 21st.dev Sliding Pill Navigation */}
      <div className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/80 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded-lg bg-zinc-800 border border-zinc-700/70 shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2">

        {isSpiking && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
            SURGE ACTIVE
          </motion.div>
        )}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
          ENGINE READY
        </div>
      </div>
    </nav>
  );
}
