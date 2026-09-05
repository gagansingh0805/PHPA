import React, { useEffect, useState, useMemo } from 'react';

/**
 * MathFormula - Publication-grade mathematical formula renderer.
 * 
 * Automatically renders LaTeX using KaTeX if available via renderToString.
 * Polls for async script loading if KaTeX is loading deferred.
 * Safely sets HTML via dangerouslySetInnerHTML so React DOM reconciliation never conflicts.
 * Provides clean, elegant fallback if KaTeX is unavailable or encounters a parse issue.
 */
export default function MathFormula({ tex, fallback, display = true, className = '' }) {
  const [katexReady, setKatexReady] = useState(() => typeof window !== 'undefined' && !!window.katex);

  useEffect(() => {
    if (typeof window === 'undefined' || window.katex) return;

    let isCancelled = false;
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.katex) {
        if (!isCancelled) setKatexReady(true);
        clearInterval(checkInterval);
      }
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  const renderedHtml = useMemo(() => {
    if (!katexReady || typeof window === 'undefined' || !window.katex || !tex) {
      return null;
    }
    try {
      return window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.warn('KaTeX render error:', err);
      return null;
    }
  }, [tex, display, katexReady]);

  return (
    <div
      className={`math-formula-box w-full rounded-lg bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 p-3.5 select-text overflow-x-auto shadow-xs ${className}`}
    >
      <div
        className={`w-full text-zinc-900 dark:text-zinc-100 ${display ? 'flex items-center justify-center min-h-[36px]' : 'inline-flex items-center'}`}
      >
        {renderedHtml ? (
          <div
            className="katex-html-container w-full overflow-x-auto flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}
