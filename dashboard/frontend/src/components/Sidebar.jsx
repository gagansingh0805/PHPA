import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  BarChart2, 
  Terminal, 
  BookOpen, 
  GitBranch, 
  ShieldCheck, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Clock,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import Term from './Term';
import PhpaLogo from './PhpaLogo';

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
  isSpiking,
  isMobileOpen = false,
  onMobileClose,
  onReturnHome,
}) {
  const navItems = [
    { id: 'overview', label: 'Research Overview', desc: 'Architecture & problem context', icon: Home },
    { id: 'lab', label: 'Telemetry Lab', desc: 'Real-time charts & pod cluster', icon: LayoutDashboard },
    { id: 'benchmark', label: 'Model Benchmarking', desc: 'Side-by-side cost & accuracy', icon: BarChart2 },
    { id: 'guardrails', label: 'Operational Guardrails', desc: 'Safety limits & chaos sandbox', icon: ShieldCheck },
    { id: 'pipeline', label: 'Pipeline Architecture', desc: 'Kubernetes CRD & controller', icon: GitBranch },
    { id: 'logs', label: 'Decision Log Feed', desc: 'Live autoscaler event stream', icon: Terminal },
    { id: 'models', label: 'Mathematical Theory', desc: 'Formulations & equations', icon: BookOpen },
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Branding & Nav */}
      <div>
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => {
              if (onReturnHome) onReturnHome();
              if (isMobile && onMobileClose) onMobileClose();
            }}
            className="flex items-center gap-2.5 min-w-0 text-left p-2 -m-0.5 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-zinc-850/80 transition-all group w-full cursor-pointer focus:outline-none border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60"
            title="Return to 3D Homepage"
          >
            <PhpaLogo size="md" className="group-hover:scale-105 transition-transform flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate flex items-center gap-1.5">
                  Predictive <Term id="hpa">HPA</Term>
                </h1>
                {onReturnHome && (
                  <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 group-hover:border-zinc-400 dark:group-hover:border-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors flex-shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span>3D Home</span>
                    <span className="text-[9px] group-hover:translate-x-0.5 transition-transform">↗</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-0.5">
                <p className="truncate">Telemetry &amp; Research</p>
                <span className="text-[10px] font-mono opacity-60">v0.13.2</span>
              </div>
            </div>
          </button>

          {/* Close button for mobile drawer */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="p-1.5 ml-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex-shrink-0"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile && onMobileClose) onMobileClose();
                }}
                className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 focus:outline-none focus:ring-0 ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/70 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100 ml-1'
                      : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs tracking-tight ${
                      isActive
                        ? 'font-semibold text-zinc-900 dark:text-white'
                        : 'font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                      isActive
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Integrated Simulation Controller */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 space-y-2.5">
        {/* Simulation Clock & State */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="w-3 h-3" />
            <span className="truncate">{simTime || 'Day 1, 00:00:00'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
            <span className={`text-[10px] font-medium ${isPlaying ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
              {isPlaying ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Primary Controls: Play/Pause, Reset, Speed */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium border transition-all shadow-sm focus:outline-none focus:ring-0 ${
              isPlaying
                ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:opacity-90'
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
            className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none focus:ring-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono shadow-sm">
          <span className="text-zinc-500 px-1 font-sans">Speed:</span>
          {[1, 10, 60].map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 rounded transition-all focus:outline-none focus:ring-0 ${
                speedFactor === spd
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Flash Crowd Surge Trigger */}
        <button
          onClick={onInjectSpike}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium border transition-all shadow-sm focus:outline-none focus:ring-0 ${
            isSpiking
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900/60 hover:text-red-600 dark:hover:text-red-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span>{isSpiking ? 'Surge Active (5x)' : 'Inject 5x Surge'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 hidden lg:flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 select-none z-30">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 flex flex-col justify-between h-full select-none shadow-xl overflow-y-auto transform transition-transform duration-200 ease-out">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}


