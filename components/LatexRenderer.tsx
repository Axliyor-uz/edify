'use client';

import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
// @ts-ignore: Suppress type error if @types/katex is missing
import renderMathInElement from 'katex/dist/contrib/auto-render';

interface LatexRendererProps {
  latex: string | number | undefined | null;
  className?: string; // 🟢 Added: Allows styling from parent
}

export default function LatexRenderer({ latex, className = '' }: LatexRendererProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = spanRef.current;
    // content check
    if (!element || latex === null || latex === undefined) return;

    // 1. Set Content
    // We use String() to safely handle numbers (e.g. answer "5")
    element.innerHTML = String(latex);

    // 2. Render Math
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false,
        errorColor: '#ef4444', // Red color for errors
      });
    } catch (error) {
      console.warn("KaTeX rendering error:", error);
    }
  }, [latex]);

  // Handle empty states gracefully to prevent layout shifts
  if (latex === null || latex === undefined || latex === '') {
    return <span className={`latex-placeholder ${className}`} >&nbsp;</span>;
  }

  return <span ref={spanRef} className={`latex-content ${className}`} />;
}