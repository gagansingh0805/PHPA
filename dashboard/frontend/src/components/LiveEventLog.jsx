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
  Search,
  Download,
  Pause,
  Play,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Check,
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
    <div className="raised-card rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 font-sans text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex flex-col h-full shadow-sm relative">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          {/* Minimal window control lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
          </div>
          <div className="flex items-center gap-2 ml-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-wide">
            <Terminal className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Autoscaling Decision &amp; Telemetry Stream</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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
                ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700 shadow-sm'
                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white'
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
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('story')}
              className={`px-2.5 py-1 rounded transition-all ${
                viewMode === 'story'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Console
            </button>
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            title="Export event log as JSON"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClear}
            title="Clear all events"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all text-[11px]"
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
            { id: 'ALL', label: 'All', count: counts.ALL, activeColor: 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700', dotColor: null },
            { id: 'LSTM', label: 'ML Insights', count: counts.LSTM, activeColor: 'bg-purple-600 text-white dark:bg-purple-700 dark:text-purple-100 border-purple-600 dark:border-purple-700', dotColor: 'bg-purple-500' },
            { id: 'SCALE', label: 'Scaling', count: counts.SCALE, activeColor: 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-100 border-blue-600 dark:border-blue-700', dotColor: 'bg-blue-500' },
            { id: 'COST', label: 'Economics', count: counts.COST, activeColor: 'bg-emerald-600 text-white dark:bg-emerald-700 dark:text-emerald-100 border-emerald-600 dark:border-emerald-700', dotColor: 'bg-emerald-500' },
            { id: 'SURGE', label: 'SLA & Surge', count: counts.SURGE, activeColor: 'bg-rose-600 text-white dark:bg-rose-700 dark:text-rose-100 border-rose-600 dark:border-rose-700', dotColor: 'bg-rose-500' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all whitespace-nowrap text-[11px] ${
                filter === btn.id
                  ? `${btn.activeColor} font-semibold shadow-sm`
                  : 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {btn.dotColor && (
                <span className={`w-1.5 h-1.5 rounded-full ${filter === btn.id ? 'bg-white/70' : btn.dotColor}`}></span>
              )}
              <span>{btn.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                filter === btn.id ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[200px] md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions, pods, RPS..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-7 py-1 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3. Paused Banner Notification */}
      {isPaused && (
        <div className="mb-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-850 border border-zinc-300 dark:border-zinc-700 rounded-md flex items-center justify-between text-zinc-800 dark:text-zinc-200 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Pause className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Feed stream paused. ({unseenWhilePaused} background events queued)</span>
          </div>
          <button
            onClick={handleResumeAndScroll}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 border border-zinc-300 dark:border-zinc-600 rounded text-[10px] font-medium text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Jump to Latest</span>
          </button>
        </div>
      )}

      {/* 4. Main Event Stream Container */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-[440px] max-h-[580px] overflow-y-auto space-y-2 pr-1.5 leading-relaxed custom-scrollbar"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Filter className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mb-2" />
            <p className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">No matching decision events</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 max-w-sm">
              {searchQuery
                ? `No events matched keyword "${searchQuery}". Try a different term or clear the search.`
                : 'No events match the selected category. Use the event sandbox on the right to inject surges or adjust traffic.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            // Determine icon based on level
            let Icon = Server;
            if (log.level === 'LSTM') Icon = BrainCircuit;
            else if (log.level === 'HPA') Icon = ShieldAlert;
            else if (log.level === 'SURGE') Icon = Zap;
            else if (log.level === 'SCALE') Icon = Server;
            else if (log.level === 'COST') Icon = DollarSign;

            const isExpanded = expandedIndex === idx;
            const eventPayload = log.meta || {
              timestamp: log.time,
              severity: log.level,
              category: log.category || 'general',
              message: log.message,
              engine: 'PHPA_Autonomic_Controller_v1',
            };

            if (viewMode === 'compact') {
              // Compact console row
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-2 py-1 rounded transition-colors text-[11px] font-mono group"
                >
                  <span className="text-zinc-500 text-[10px] select-none min-w-[55px] pt-0.5">{log.time}</span>
                  <span
                    className="px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[9px] font-bold select-none min-w-[55px] text-center"
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 flex-1 leading-snug">{log.message}</span>
                  <button
                    onClick={() => handleCopyJson(idx, eventPayload)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
                    title="Copy event payload"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              );
            }

            // Rich Story Card View
            return (
              <div
                key={idx}
                className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs font-sans group relative"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mt-0.5 shrink-0 text-zinc-700 dark:text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Badges, Time, Inspector Button */}
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-semibold tracking-wider">
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
                              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700 shadow-sm'
                              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
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
                    <div className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed">
                      {log.message}
                    </div>

                    {/* Collapsible JSON Inspector */}
                    {isExpanded && (
                      <div className="mt-2.5 p-2.5 rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 relative animate-fadeIn">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px]">
                          <span>EVENT PAYLOAD RECORD</span>
                          <button
                            onClick={() => handleCopyJson(idx, eventPayload)}
                            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto text-[11px] leading-tight">
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
      <div className="pt-2.5 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span>Displaying {filteredLogs.length} of {logs.length} logged events</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Scrape: 15s Prometheus Cadence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">Feed Synchronized</span>
        </div>
      </div>
    </div>
  );
}

