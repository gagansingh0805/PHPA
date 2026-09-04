import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-zinc-900/95 border border-zinc-700/80 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs">
        <div className="font-mono text-zinc-400 mb-2 border-b border-zinc-800 pb-1 font-semibold">
          Time: {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">{entry.value} pods</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bento-card rounded-xl p-4">
      {/* Chart Title and Interactive Model Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            Replicas & Forecasting Comparison
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time scaling decisions across Reactive HPA, Linear, Holt-Winters, and LSTM
          </p>
        </div>

        {/* 21st.dev Model Spotlight Pill Toggles */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => toggle('actual')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visibility.actual
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 line-through opacity-60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Actual Pods
          </button>

          <button
            onClick={() => toggle('reactive')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visibility.reactive
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 line-through opacity-60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Reactive HPA
          </button>

          <button
            onClick={() => toggle('linear')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visibility.linear
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 line-through opacity-60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Linear
          </button>

          <button
            onClick={() => toggle('hw')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visibility.hw
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 line-through opacity-60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Holt-Winters
          </button>

          <button
            onClick={() => toggle('lstm')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visibility.lstm
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 line-through opacity-60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            LSTM Model
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#3f3f46' }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#3f3f46' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Curves */}
            {visibility.actual && (
              <Line
                type="monotone"
                dataKey="actual_pods"
                name="Actual Pods"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {visibility.reactive && (
              <Line
                type="monotone"
                dataKey="reactive_hpa"
                name="Reactive HPA"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {visibility.linear && (
              <Line
                type="monotone"
                dataKey="linear_pred"
                name="Linear"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {visibility.hw && (
              <Line
                type="monotone"
                dataKey="holt_winters_pred"
                name="Holt-Winters"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {visibility.lstm && (
              <Line
                type="monotone"
                dataKey="lstm_pred"
                name="LSTM Model"
                stroke="#a855f7"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

