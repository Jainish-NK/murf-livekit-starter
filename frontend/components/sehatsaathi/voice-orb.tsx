'use client';

import { Mic } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { UIState } from '@/hooks/use-ui-state';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

interface VoiceOrbProps {
  uiState: UIState;
  /** 0–1 normalized volume for listening/speaking reactivity */
  volume?: number;
  className?: string;
  size?: number;
}

export function VoiceOrb({ uiState, volume = 0, className, size = 180 }: VoiceOrbProps) {
  const reducedMotion = usePrefersReducedMotion();
  const clamped = Math.min(1, Math.max(0, volume));

  const isListening = uiState === 'listening';
  const isSpeaking = uiState === 'speaking';
  const isConnecting = uiState === 'connecting';
  const isEnded = uiState === 'ended';

  // Volume scale for core mic icon and glow
  const volumeScale = 1 + clamped * (isListening || isSpeaking ? 0.16 : 0);

  return (
    <div
      className={cn('relative flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`AI voice receptionist orb. State is ${uiState}.`}
    >
      {/* 1. Ambient 3D Tricolor Backlight Glow */}
      <div
        className={cn(
          'absolute inset-[4%] rounded-full transition-[opacity,transform,filter] duration-300 ease-out',
          !reducedMotion && 'ss-animate-pulse-subtle'
        )}
        style={{
          background:
            'radial-gradient(circle, rgba(255,153,51,0.45) 0%, rgba(255,255,255,0.3) 45%, rgba(19,136,8,0.45) 100%)',
          opacity: isEnded ? 0.1 : isConnecting ? 0.6 : 0.45 + clamped * 0.4,
          filter: `blur(${16 + clamped * 12}px)`,
          transform: `scale(${volumeScale})`,
        }}
      />

      {/* 2. Floating ambient particle dots (Orange, White, Green) */}
      {!reducedMotion && !isEnded && (
        <>
          {/* Top-Right Saffron particle */}
          <span
            className="absolute top-1 right-3 size-2 sm:size-2.5 rounded-full bg-saffron opacity-85 ss-animate-float"
            style={{ animationDelay: '0.2s' }}
          />
          {/* Bottom-Left Green particle */}
          <span
            className="absolute bottom-2 left-2 size-1.5 sm:size-2 rounded-full bg-green opacity-80 ss-animate-float"
            style={{ animationDelay: '1.2s' }}
          />
          {/* Top-Left Tiny White particle */}
          <span
            className="absolute top-4 left-1 size-1.5 rounded-full bg-white shadow-xs opacity-90 ss-animate-float"
            style={{ animationDelay: '2.4s' }}
          />
          {/* Bottom-Right Saffron particle */}
          <span
            className="absolute bottom-4 right-1 size-1.5 sm:size-2 rounded-full bg-saffron opacity-80 ss-animate-float"
            style={{ animationDelay: '1.8s' }}
          />
        </>
      )}

      {/* 3. 3D Moving Flag Colors Circular Border (Saffron -> White -> Green Smooth 3D Sweep) */}
      <div
        className={cn(
          'absolute inset-0 rounded-full p-[3.5px] transition-all duration-300',
          !reducedMotion && 'ss-animate-spin-3d'
        )}
        style={{
          background:
            'conic-gradient(from 0deg, #FF9933 0%, #FFAA4D 20%, #FFFFFF 38%, #F8FAFC 52%, #10B981 70%, #138808 85%, #FF9933 100%)',
          boxShadow:
            '0 0 16px rgba(255, 153, 51, 0.35), 0 0 24px rgba(19, 136, 8, 0.3)',
          transform: `scale(${1 + clamped * 0.08})`,
        }}
      >
        {/* Inner masking layer creating the sleek glowing 3D border ring */}
        <div className="w-full h-full rounded-full bg-surface-soft dark:bg-background" />
      </div>

      {/* 4. Secondary Counter-Rotating Subtle Ring for 3D depth */}
      <div
        className={cn(
          'absolute inset-[6%] rounded-full border border-dashed transition-all duration-300',
          !reducedMotion && 'ss-animate-spin-3d'
        )}
        style={{
          borderColor: isSpeaking ? '#FF9933' : isListening ? '#138808' : '#CBD5E1',
          opacity: 0.7,
          animationDirection: 'reverse',
          animationDuration: '12s',
          transform: `scale(${1 + clamped * 0.05})`,
        }}
      />

      {/* 5. Inner Core: Solid Green Button with Centered White Microphone Icon */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full shadow-md transition-all duration-300',
          !reducedMotion && !isEnded && 'ss-animate-pulse-subtle'
        )}
        style={{
          width: size * 0.58,
          height: size * 0.58,
          background: isSpeaking
            ? 'linear-gradient(135deg, #FF9933 0%, #E06A1D 100%)'
            : isEnded
              ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
              : 'linear-gradient(135deg, #138808 0%, #0F6E56 100%)',
          boxShadow: '0 8px 24px rgba(19, 136, 8, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
          transform: `scale(${volumeScale})`,
        }}
      >
        {/* Specular Highlight for 3D sphere depth */}
        <div className="absolute top-2 left-3 w-7 h-3 rounded-full bg-white/40 blur-2xs" />

        {/* White Centered Microphone Icon */}
        <Mic
          className="size-7 sm:size-8 text-white transition-transform duration-200"
          style={{
            transform: `scale(${1 + clamped * 0.12})`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
