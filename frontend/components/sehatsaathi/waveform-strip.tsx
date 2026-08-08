'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/shadcn/utils';

interface WaveformStripProps {
  /** Current mic volume 0–1 */
  volume: number;
  active?: boolean;
  className?: string;
  barCount?: number;
  color?: string;
}

/**
 * Lightweight live waveform driven by a single volume value.
 * Keeps a short rolling history so the strip feels continuous.
 */
export function WaveformStrip({
  volume,
  active = true,
  className,
  barCount = 28,
  color = '#FF8C42',
}: WaveformStripProps) {
  const historyRef = useRef<number[]>(Array.from({ length: barCount }, () => 0.08));
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      historyRef.current = Array.from({ length: barCount }, () => 0.08);
    } else {
      const next = historyRef.current.slice(1);
      next.push(Math.min(1, Math.max(0.06, volume * 1.35 + 0.06)));
      historyRef.current = next;
    }

    const root = barsRef.current;
    if (!root) return;
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const v = historyRef.current[i] ?? 0.08;
      el.style.height = `${Math.round(v * 100)}%`;
      el.style.opacity = String(0.35 + v * 0.65);
    }
  }, [volume, active, barCount]);

  return (
    <div
      ref={barsRef}
      className={cn(
        'flex h-10 w-full max-w-xs items-end justify-center gap-[3px]',
        !active && 'opacity-40',
        className
      )}
      aria-hidden
    >
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-[height,opacity] duration-75 ease-out"
          style={{
            backgroundColor: color,
            height: '8%',
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}
