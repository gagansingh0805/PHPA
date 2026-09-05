import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl text-xs min-w-[200px]">
      <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 font-semibold flex items-center justify-between">
        <span className="text-zinc-400 dark:text-zinc-500">Virtual Time</span>
        <span className="text-zinc-800 dark:text-zinc-200">{label}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white tabular-nums">
              {entry.value} <span className="text-zinc-400 font-normal text-[10px]">pods</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ReplicasChart({ data }) {
  // Visibility toggles for each model
  const [visibility, setVisibility] = useState({
    actual: true,
    reactive: true,
    linear: true,
    hw: true,
    lstm: true,
  });

  const toggle = (key) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
      {/* Chart Title and Interactive Model Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            Replicas &amp; Forecasting Comparison
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time scaling decisions across Reactive HPA, Linear, Holt-Winters, and Stacked LSTM
          </p>
        </div>

        {/* Model Spotlight Pill Toggles */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => toggle('actual')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visibility.actual
                ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            Actual Pods
          </button>

          <button
            onClick={() => toggle('reactive')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visibility.reactive
                ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Reactive HPA
          </button>

          <button
            onClick={() => toggle('linear')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visibility.linear
                ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Linear
          </button>

          <button
            onClick={() => toggle('hw')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visibility.hw
                ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Holt-Winters
          </button>

          <button
            onClick={() => toggle('lstm')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visibility.lstm
                ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'bg-transparent text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            LSTM Model
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} syncId="telemetry-sync" margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#71717a" opacity={0.15} />
            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#71717a', opacity: 0.3 }}
              interval="preserveStartEnd"
              minTickGap={35}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#71717a', opacity: 0.3 }}
              allowDecimals={false}
              domain={[0, dataMax => Math.max(10, Math.ceil(dataMax * 1.2))]}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Curves */}
            {visibility.actual && (
              <Line
                type="monotone"
                dataKey="actual_pods"
                name="Actual Pods"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )}
            {visibility.reactive && (
              <Line
                type="monotone"
                dataKey="reactive_hpa"
                name="Reactive HPA"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="2 3"
                dot={false}
                activeDot={{ r: 4, stroke: '#94a3b8', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )}
            {visibility.linear && (
              <Line
                type="monotone"
                dataKey="linear_pred"
                name="Linear"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="6 3 2 3"
                dot={false}
                activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )}
            {visibility.hw && (
              <Line
                type="monotone"
                dataKey="holt_winters_pred"
                name="Holt-Winters"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )}
            {visibility.lstm && (
              <Line
                type="monotone"
                dataKey="lstm_pred"
                name="LSTM Model"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, stroke: '#a855f7', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

