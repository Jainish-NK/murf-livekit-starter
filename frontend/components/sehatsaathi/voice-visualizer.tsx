'use client';

import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import type { UIState } from '@/hooks/use-ui-state';
import { cn } from '@/lib/shadcn/utils';

interface VoiceVisualizerProps {
  uiState: UIState;
  volume?: number;
  className?: string;
  barCount?: number;
}

export function VoiceVisualizer({
  uiState,
  volume = 0,
  className,
  barCount = 18,
}: VoiceVisualizerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const clamped = Math.min(1, Math.max(0, volume));

  // Multiplier weights for bars (symmetrical center peak)
  const barWeights = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
      return Math.sin((1 - distFromCenter) * (Math.PI / 2));
    });
  }, [barCount]);

  const isActive = uiState === 'listening' || uiState === 'speaking';
  const isSpeaking = uiState === 'speaking';
  const isListening = uiState === 'listening';

  return (
    <div
      className={cn(
        'flex h-10 items-center justify-center gap-1.5 px-4 py-1 select-none',
        className
      )}
      role="presentation"
      aria-hidden="true"
    >
      {barWeights.map((weight, idx) => {
        let heightPercent: number;

        if (reducedMotion || uiState === 'ended') {
          heightPercent = 15;
        } else if (isActive) {
          // Dynamic volume reactivity with distinct wave shape
          const wavePhase = Math.sin(idx * 0.6 + Date.now() * 0.005);
          heightPercent = Math.min(
            100,
            Math.max(18, (clamped * 75 + 15) * weight + wavePhase * 10 * (clamped > 0.02 ? 1 : 0))
          );
        } else if (uiState === 'connecting') {
          heightPercent = 20 + Math.sin(idx * 0.5) * 15;
        } else {
          // Ready / idle
          heightPercent = 14 + weight * 8;
        }

        const barBg = isListening
          ? 'bg-gradient-to-t from-brand-green to-brand-green-bright shadow-[0_0_8px_rgba(16,185,129,0.4)]'
          : isSpeaking
            ? 'bg-gradient-to-t from-brand-saffron to-amber-400 shadow-[0_0_8px_rgba(255,153,51,0.4)]'
            : uiState === 'connecting'
              ? 'bg-brand-sky/70'
              : 'bg-muted-foreground/30';

        return (
          <span
            key={`vis-bar-${idx}`}
            className={cn('w-1 rounded-full transition-all duration-100 ease-out', barBg)}
            style={{
              height: `${heightPercent}%`,
              minHeight: '4px',
            }}
          />
        );
      })}
    </div>
  );
}
