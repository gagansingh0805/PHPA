import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PHPA Dashboard ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-zinc-900 dark:text-zinc-100 max-w-2xl mx-auto my-8">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-sm font-bold">Component Exception Caught</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
            An unexpected error occurred while rendering this view:
          </p>
          <pre className="p-3 rounded bg-zinc-950 text-red-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 mb-4 max-h-48">
            {this.state.error?.toString() || 'Unknown error'}
          </pre>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 transition-all hover:opacity-90 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover &amp; Reset View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
