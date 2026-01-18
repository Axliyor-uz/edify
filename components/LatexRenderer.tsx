'use client';

import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render';

interface LatexRendererProps {
  latex: string | number | undefined | null;
}

export default function LatexRenderer({ latex }: LatexRendererProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current && latex !== null && latex !== undefined) {
      // Force conversion to string to prevent crashes
      spanRef.current.innerHTML = String(latex);

      // Render the math
      renderMathInElement(spanRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false,
      });
    }
  }, [latex]);

  if (latex === null || latex === undefined || latex === '') return null;

  return <span ref={spanRef} className="latex-container" />;
}