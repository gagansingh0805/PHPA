import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="bento-card rounded-xl p-3.5 border border-purple-500/30 bg-gradient-to-b from-purple-950/15 via-zinc-900/90 to-zinc-900/90 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white">
            LSTM Model Attribution & Advantage Analysis
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40">
          LSTM Preemptive Leader
        </span>
      </div>

      {/* 3 Impact Cards Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 relative z-10">
        {/* Card 1: Pod Deficit Prevented vs HPA */}
        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-purple-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-0.5">
            <span className="text-[10px] font-semibold uppercase">HPA Deficit Prevented</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-mono font-bold text-purple-300">
            +{hpaShortfall > 0 ? hpaShortfall : 0} <span className="text-[10px] font-sans font-normal text-zinc-400">pods</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            {hpaShortfall > 0 ? `Saved ~${requestsSaved} reqs!` : 'Demand in sync'}
          </div>
        </div>

        {/* Card 2: Linear Overshoot Avoided */}
        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-blue-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-0.5">
            <span className="text-[10px] font-semibold uppercase">Waste Avoided</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-mono font-bold text-blue-300">
            {linearOvershootAvoided > 0 ? `-${linearOvershootAvoided}` : '0'} <span className="text-[10px] font-sans font-normal text-zinc-400">pods</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            {linearOvershootAvoided > 0 ? `-$${(linearOvershootAvoided * 0.04).toFixed(2)}/hr` : 'No overshoot'}
          </div>
        </div>

        {/* Card 3: Preemptive Lead Time */}
        <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-emerald-500/20">
          <div className="flex items-center justify-between text-zinc-400 mb-0.5">
            <span className="text-[10px] font-semibold uppercase">Lead Time Buffer</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-300">
            {is_spiking ? '~25s' : '~15s'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            Preempts demand
          </div>
        </div>
      </div>

      {/* Real-Time Decision Attribution Ledger */}
      <div className="rounded-lg bg-zinc-950/90 border border-zinc-800/80 p-2.5 text-xs font-mono space-y-1.5 relative z-10">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-1 font-sans">
          <span>Current Model Decisions</span>
          <span className="text-zinc-500 font-mono text-[9px]">Decision: max(...)</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {/* Reactive HPA */}
          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-400 text-[9px]">HPA (Native)</div>
            <div className="text-white font-bold text-xs mt-0.5">{reactive_hpa} pods</div>
            <div className="text-[9px] text-zinc-500 truncate">
              {ideal_demand > reactive_hpa ? `Lag: -${ideal_demand - reactive_hpa}` : 'Matches'}
            </div>
          </div>

          {/* Linear */}
          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-blue-400 text-[9px]">Linear</div>
            <div className="text-blue-200 font-bold text-xs mt-0.5">{linear_pred} pods</div>
            <div className="text-[9px] text-zinc-500 truncate">
              {linear_pred > ideal_demand ? `+${linear_pred - ideal_demand} over` : 'On track'}
            </div>
          </div>

          {/* Holt-Winters */}
          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-emerald-400 text-[9px]">Holt-Winters</div>
            <div className="text-emerald-200 font-bold text-xs mt-0.5">{holt_winters_pred} pods</div>
            <div className="text-[9px] text-zinc-500 truncate">
              {is_spiking ? 'Missed burst' : '24h cycle'}
            </div>
          </div>

          {/* LSTM */}
          <div className="p-1.5 rounded bg-purple-950/40 border border-purple-500/40">
            <div className="text-purple-400 font-bold text-[9px] flex items-center justify-between">
              <span>LSTM</span>
              <span className="text-[8px] px-1 rounded bg-purple-500/20 text-purple-300">LEAD</span>
            </div>
            <div className="text-purple-200 font-bold text-xs mt-0.5">{lstm_pred} pods</div>
            <div className="text-[9px] text-purple-300 truncate">
              {lstm_pred > reactive_hpa ? `+${lstm_pred - reactive_hpa} lead` : 'Optimal'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
