import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function WorkloadChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-zinc-900/95 border border-zinc-700/80 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs">
        <div className="font-mono text-zinc-400 mb-1 font-semibold">{label}</div>
        <div className="space-y-1">
          <div className="text-amber-400 font-medium">RPS: {payload[0]?.value} req/s</div>
          <div className="text-rose-400 font-medium">CPU: {payload[1]?.value}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="bento-card rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-white">Workload Telemetry (Request Rate & CPU Load)</h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> RPS
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> CPU %
          </span>
        </div>
      </div>

      <div className="h-[135px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
            <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
            <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rps"
              name="RPS"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#rpsGradient)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="cpu_utilization"
              name="CPU %"
              stroke="#f43f5e"
              strokeWidth={2}
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

