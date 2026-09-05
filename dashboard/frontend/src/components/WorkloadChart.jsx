import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs min-w-[150px]">
      <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-1 font-semibold flex items-center justify-between">
        <span className="text-zinc-400 dark:text-zinc-500">Time</span>
        <span className="text-zinc-800 dark:text-zinc-200">{label}</span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex items-center justify-between gap-3 text-cyan-600 dark:text-cyan-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            RPS:
          </span>
          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{payload[0]?.value} req/s</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            CPU:
          </span>
          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{payload[1]?.value}%</span>
        </div>
      </div>
    </div>
  );
};

export default function WorkloadChart({ data }) {

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Workload Telemetry (Request Rate &amp; CPU Load)</h3>
        <div className="flex items-center gap-3 text-[11px] font-mono font-medium">
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> RPS
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> CPU %
          </span>
        </div>
      </div>

      <div className="h-[165px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId="telemetry-sync" margin={{ top: 5, right: 12, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#71717a" opacity={0.15} />
            <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#71717a', opacity: 0.3 }} interval="preserveStartEnd" minTickGap={35} />
            <YAxis yAxisId="rps" stroke="#06b6d4" fontSize={10} tickLine={false} axisLine={false} width={36} domain={[0, 'auto']} />
            <YAxis yAxisId="cpu" orientation="right" stroke="#e11d48" fontSize={10} tickLine={false} axisLine={false} width={32} domain={[0, 100]} />
            <ReferenceLine yAxisId="cpu" y={60} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target 60%', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="rps"
              type="monotone"
              dataKey="rps"
              name="RPS"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#rpsGradient)"
              isAnimationActive={false}
            />
            <Area
              yAxisId="cpu"
              type="monotone"
              dataKey="cpu_utilization"
              name="CPU %"
              stroke="#e11d48"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#cpuGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

