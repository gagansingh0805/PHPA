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
  Search,
  Download,
  Pause,
  Play,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Check,
  RefreshCw,
  ArrowDown
} from 'lucide-react';

export default function LiveEventLog({ logs = [], onClear }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'LSTM' | 'SCALE' | 'COST' | 'SURGE'
  const [viewMode, setViewMode] = useState('story'); // 'story' | 'compact'
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [unseenWhilePaused, setUnseenWhilePaused] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const logContainerRef = useRef(null);
  const prevLogsLengthRef = useRef(logs.length);

  // Track new logs while paused or auto-scroll when active
  useEffect(() => {
    if (isPaused) {
      if (logs.length > prevLogsLengthRef.current) {
        setUnseenWhilePaused((prev) => prev + (logs.length - prevLogsLengthRef.current));
      }
    } else {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
      setUnseenWhilePaused(0);
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs, isPaused]);

  const handleResumeAndScroll = () => {
    setIsPaused(false);
    setUnseenWhilePaused(0);
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phpa_autonomic_events_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = (index, payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Counts for filter pills
  const counts = {
    ALL: logs.length,
    LSTM: logs.filter((l) => l.level === 'LSTM' || l.category === 'insight').length,
    SCALE: logs.filter((l) => l.level === 'SCALE' || l.category === 'scale').length,
    COST: logs.filter((l) => l.level === 'COST' || l.category === 'cost').length,
    SURGE: logs.filter((l) => l.level === 'SURGE' || l.level === 'HPA' || l.category === 'alert').length,
  };

  const filteredLogs = logs.filter((log) => {
    // Category match
    let matchesCategory = true;
    if (filter === 'LSTM') matchesCategory = log.level === 'LSTM' || log.category === 'insight';
    else if (filter === 'SCALE') matchesCategory = log.level === 'SCALE' || log.category === 'scale';
    else if (filter === 'COST') matchesCategory = log.level === 'COST' || log.category === 'cost';
    else if (filter === 'SURGE') matchesCategory = log.level === 'SURGE' || log.level === 'HPA' || log.category === 'alert';

    if (!matchesCategory) return false;

    // Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const msg = (log.message || '').toLowerCase();
    const lvl = (log.level || '').toLowerCase();
    const time = (log.time || '').toLowerCase();
    const cat = (log.category || '').toLowerCase();
    return msg.includes(q) || lvl.includes(q) || time.includes(q) || cat.includes(q);
  });

  return (
    <div className="bento-card rounded-xl p-4 border border-zinc-800/90 font-sans text-xs bg-zinc-950/95 flex flex-col h-full shadow-2xl relative">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          {/* macOS window control lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
          </div>
          <div className="flex items-center gap-2 ml-2 text-zinc-100 font-bold text-xs tracking-wide">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Autoscaling Decision & Telemetry Stream</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Pause / Resume Button */}
          <button
            onClick={() => {
              if (isPaused) {
                handleResumeAndScroll();
              } else {
                setIsPaused(true);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`}
            title={isPaused ? 'Resume stream auto-scroll' : 'Pause stream auto-scroll'}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Resume ({unseenWhilePaused})</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Mode Switcher: Story vs Console */}
          <div className="flex items-center bg-zinc-900/90 rounded-md border border-zinc-800 p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('story')}
              className={`px-2.5 py-1 rounded transition-all ${
                viewMode === 'story'
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Story Feed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Console
            </button>
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            title="Export event log as JSON"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClear}
            title="Clear all events"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Filter Pills & Live Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mb-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-[11px] select-none scrollbar-none">
          {[
            { id: 'ALL', label: `All`, count: counts.ALL },
            { id: 'LSTM', label: '🧠 ML Insights', count: counts.LSTM },
            { id: 'SCALE', label: '⚡ Pod Scaling', count: counts.SCALE },
            { id: 'COST', label: '💰 Savings & Cost', count: counts.COST },
            { id: 'SURGE', label: '⚠️ SLA & Lag', count: counts.SURGE },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-[11px] ${
                filter === btn.id
                  ? 'bg-zinc-800 text-white border-purple-500/50 font-medium shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span>{btn.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                filter === btn.id ? 'bg-purple-500/30 text-purple-200' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[200px] md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions, pods, RPS..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-7 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3. Paused Banner Notification */}
      {isPaused && (
        <div className="mb-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between text-amber-300 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>Feed stream paused for inspection. ({unseenWhilePaused} new background events queued)</span>
          </div>
          <button
            onClick={handleResumeAndScroll}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] font-medium text-amber-200 transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Jump to Latest</span>
          </button>
        </div>
      )}

      {/* 4. Main Event Stream Container */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-[440px] max-h-[580px] overflow-y-auto space-y-2 pr-1.5 leading-relaxed selection:bg-purple-500/30 custom-scrollbar"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Filter className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-zinc-300 font-medium text-xs">No matching decision events</p>
            <p className="text-zinc-500 text-[11px] mt-1 max-w-sm">
              {searchQuery
                ? `No events matched keyword "${searchQuery}". Try a different term or clear the filter.`
                : 'No events match the selected category. Use the event sandbox on the right to inject traffic surges or adjust RPS.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs"
              >
                Clear Search Query
              </button>
            )}
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

            const isExpanded = expandedIndex === idx;
            const eventPayload = log.meta || {
              timestamp: log.time,
              severity: log.level,
              category: log.category || 'general',
              message: log.message,
              engine: 'PHPA_Autonomic_Controller_v1',
            };

            if (viewMode === 'compact') {
              // Compact terminal row
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 hover:bg-zinc-900/80 px-2 py-1 rounded transition-colors text-[11px] font-mono group"
                >
                  <span className="text-zinc-500 text-[10px] select-none min-w-[55px] pt-0.5">{log.time}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${badgeBg} ${badgeBorder} select-none min-w-[55px] text-center`}
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-300 flex-1 leading-snug">{log.message}</span>
                  <button
                    onClick={() => handleCopyJson(idx, eventPayload)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 p-0.5"
                    title="Copy event payload"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              );
            }

            // Rich Story Card View (Executive Readability)
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${cardGlow} hover:border-zinc-700/80 transition-all text-xs font-sans group relative`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 mt-0.5 shrink-0">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Badges, Time, Inspector Button */}
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-wider ${badgeBg} ${badgeBorder}`}>
                          {log.level}
                        </span>
                        {log.category && (
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
                            • {log.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">{log.time}</span>
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono transition-all ${
                            isExpanded
                              ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                          title="Inspect raw event JSON"
                        >
                          <Code className="w-3 h-3" />
                          <span>JSON</span>
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="text-zinc-200 text-xs leading-relaxed">
                      {log.message}
                    </div>

                    {/* Collapsible JSON Inspector */}
                    {isExpanded && (
                      <div className="mt-2.5 p-2.5 rounded-md bg-zinc-950 border border-zinc-800/90 font-mono text-[11px] text-zinc-300 relative animate-fadeIn">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-900 text-zinc-500 text-[10px]">
                          <span>EVENT PAYLOAD RECORD</span>
                          <button
                            onClick={() => handleCopyJson(idx, eventPayload)}
                            className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto text-[11px] text-zinc-300 leading-tight">
                          {JSON.stringify(eventPayload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Bottom Status Footer */}
      <div className="pt-2.5 mt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span>Displaying {filteredLogs.length} of {logs.length} logged events</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Scrape: 15s Prometheus Cadence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-semibold">Feed Synchronized</span>
        </div>
      </div>
    </div>
  );
}
