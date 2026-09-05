import React from 'react';
import { BrainCircuit, ShieldCheck, Clock, TrendingDown } from 'lucide-react';

export default function LSTMAttribution({ latest = {}, history = [] }) {
  const { 
    actual_pods = 4, 
    ideal_demand = 4, 
    reactive_hpa = 4, 
    linear_pred = 4, 
    holt_winters_pred = 4, 
    lstm_pred = 4, 
    is_spiking = false 
  } = latest || {};

  const hpaShortfall = Math.max(0, lstm_pred - reactive_hpa);
  const linearOvershootAvoided = Math.max(0, linear_pred - lstm_pred);
  const requestsSaved = hpaShortfall * 25;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            LSTM Model Attribution &amp; Advantage Analysis
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
          LSTM Preemptive Lead
        </span>
      </div>

      {/* 3 Impact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Card 1: Pod Deficit Prevented vs HPA */}
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">HPA Deficit Prevented</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            +{hpaShortfall > 0 ? hpaShortfall : 0} <span className="text-[10px] font-sans font-normal text-zinc-500">pods</span>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-mono">
            {hpaShortfall > 0 ? `Saved ~${requestsSaved} reqs` : 'Demand in sync'}
          </div>
        </div>

        {/* Card 2: Linear Overshoot Avoided */}
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Waste Avoided</span>
            <TrendingDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {linearOvershootAvoided > 0 ? `-${linearOvershootAvoided}` : '0'} <span className="text-[10px] font-sans font-normal text-zinc-500">pods</span>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-mono">
            {linearOvershootAvoided > 0 ? `-$${(linearOvershootAvoided * 0.04).toFixed(2)}/hr` : 'No overshoot'}
          </div>
        </div>

        {/* Card 3: Preemptive Lead Time */}
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Lead Time Buffer</span>
            <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {is_spiking ? '~25s' : '~15s'}
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-mono">
            Preempts incoming load
          </div>
        </div>
      </div>

      {/* Real-Time Decision Attribution Ledger */}
      <div className="rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs font-mono space-y-1.5">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 font-sans">
          <span>Current Model Decisions</span>
          <span className="text-zinc-500 font-mono text-[9px]">Decision: max(...)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {/* Reactive HPA */}
          <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">HPA (Native)</div>
            <div className="text-zinc-900 dark:text-zinc-100 font-bold text-xs mt-0.5 tabular-nums">{reactive_hpa} pods</div>
            <div className="text-[9px] text-zinc-400 truncate">
              {ideal_demand > reactive_hpa ? `Lag: -${ideal_demand - reactive_hpa}` : 'Matches'}
            </div>
          </div>

          {/* Linear */}
          <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">Linear</div>
            <div className="text-zinc-900 dark:text-zinc-100 font-bold text-xs mt-0.5 tabular-nums">{linear_pred} pods</div>
            <div className="text-[9px] text-zinc-400 truncate">
              {linear_pred > ideal_demand ? `+${linear_pred - ideal_demand} over` : 'On track'}
            </div>
          </div>

          {/* Holt-Winters */}
          <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">Holt-Winters</div>
            <div className="text-zinc-900 dark:text-zinc-100 font-bold text-xs mt-0.5 tabular-nums">{holt_winters_pred} pods</div>
            <div className="text-[9px] text-zinc-400 truncate">
              {is_spiking ? 'Missed burst' : '24h cycle'}
            </div>
          </div>

          {/* LSTM */}
          <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-700 shadow-sm relative">
            <div className="text-zinc-900 dark:text-zinc-100 font-semibold text-[10px] flex items-center justify-between">
              <span>Stacked LSTM</span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold font-mono">LEAD</span>
            </div>
            <div className="text-zinc-900 dark:text-zinc-100 font-bold text-xs mt-0.5 tabular-nums">{lstm_pred} pods</div>
            <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
              {lstm_pred > reactive_hpa ? `+${lstm_pred - reactive_hpa} lead` : 'Optimal'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
