import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function LiveEventLog({ logs, onClear }) {
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom of log stream
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bento-card rounded-xl p-3.5 border border-zinc-800/90 font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {/* macOS window buttons */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-zinc-300 font-bold text-[11px] font-sans">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Live Autoscaling Decision & Telemetry Logs</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Live Stream ({logs.length} events)</span>
          <button
            onClick={onClear}
            title="Clear logs"
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Window */}
      <div
        ref={logContainerRef}
        className="h-44 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono leading-relaxed selection:bg-purple-500/30"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic py-4 text-center">
            Waiting for autoscaling events... (Run trace or inject spike to generate decisions)
          </div>
        ) : (
          logs.map((log, idx) => {
            let badgeBg = 'bg-zinc-800 text-zinc-300';
            let badgeBorder = 'border-zinc-700';
            if (log.level === 'LSTM') {
              badgeBg = 'bg-purple-950/60 text-purple-300';
              badgeBorder = 'border-purple-500/40';
            } else if (log.level === 'HPA') {
              badgeBg = 'bg-amber-950/60 text-amber-300';
              badgeBorder = 'border-amber-500/40';
            } else if (log.level === 'SURGE') {
              badgeBg = 'bg-red-950/60 text-red-300';
              badgeBorder = 'border-red-500/40';
            } else if (log.level === 'SCALE') {
              badgeBg = 'bg-cyan-950/60 text-cyan-300';
              badgeBorder = 'border-cyan-500/40';
            } else if (log.level === 'LINEAR') {
              badgeBg = 'bg-blue-950/60 text-blue-300';
              badgeBorder = 'border-blue-500/40';
            }

            return (
              <div key={idx} className="flex items-start gap-2 hover:bg-zinc-900/60 p-0.5 rounded transition-colors">
                <span className="text-zinc-500 text-[10px] select-none min-w-[55px]">{log.time}</span>
                <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${badgeBg} ${badgeBorder} select-none min-w-[55px] text-center`}>
                  {log.level}
                </span>
                <span className="text-zinc-300 flex-1">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
