/**
 * Centralized model color tokens for the PHPA dashboard.
 * Every chart, scorecard, and visualization should import from here
 * to maintain visual identity consistency across all views.
 */

// Model prediction algorithm colors — matched to tailwind.config.js tokens
export const MODEL_COLORS = {
  actual:   { hex: '#06b6d4', tw: 'cyan-500',    name: 'Actual Pods',   dash: undefined },
  reactive: { hex: '#94a3b8', tw: 'slate-400',   name: 'Reactive HPA',  dash: '2 3' },
  linear:   { hex: '#3b82f6', tw: 'blue-500',    name: 'Linear',        dash: '6 3 2 3' },
  hw:       { hex: '#10b981', tw: 'emerald-500', name: 'Holt-Winters',  dash: '8 4' },
  lstm:     { hex: '#a855f7', tw: 'purple-500',  name: 'LSTM Model',    dash: undefined },
};

// Workload telemetry colors — deliberately different from model colors
// to avoid cross-chart confusion (previously RPS was amber, same as Reactive HPA)
export const TELEMETRY_COLORS = {
  rps: { hex: '#06b6d4', name: 'Request Rate' },   // Cyan
  cpu: { hex: '#e11d48', name: 'CPU Load' },         // Rose
};

// Event log category colors for semantic filtering
export const LOG_CATEGORY_COLORS = {
  LSTM:  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  SCALE: { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-200 dark:border-blue-800' },
  COST:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  SURGE: { bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-300',     border: 'border-rose-200 dark:border-rose-800' },
};
