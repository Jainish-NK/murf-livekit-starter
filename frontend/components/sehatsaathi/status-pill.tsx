'use client';

import { cn } from '@/lib/shadcn/utils';
import type { StatusPillLabel } from '@/hooks/use-ui-state';
import type { SupportedLanguage } from '@/lib/translations';

interface StatusPillProps {
  label: StatusPillLabel;
  lang?: SupportedLanguage;
  className?: string;
}

const LOCALIZED_LABELS: Record<SupportedLanguage, Record<StatusPillLabel, string>> = {
  hinglish: {
    Idle: 'Ready to talk',
    Connecting: 'Connecting...',
    Listening: 'Listening to you',
    Speaking: 'SehatSaathi is speaking',
    Reconnecting: 'Reconnecting...',
    Disconnected: 'Call ended',
  },
  hi: {
    Idle: 'बातचीत के लिए तैयार',
    Connecting: 'कनेक्ट हो रहा है...',
    Listening: 'आपकी बात सुन रहे हैं',
    Speaking: 'सेहतसाथी बोल रही है',
    Reconnecting: 'पुनः कनेक्ट हो रहा है...',
    Disconnected: 'बातचीत समाप्त',
  },
  en: {
    Idle: 'Ready to talk',
    Connecting: 'Connecting...',
    Listening: 'Listening to you',
    Speaking: 'SehatSaathi is speaking',
    Reconnecting: 'Reconnecting...',
    Disconnected: 'Call ended',
  },
  gu: {
    Idle: 'વાત માટે તૈયાર',
    Connecting: 'જોડાઈ રહ્યા છીએ...',
    Listening: 'તમારી વાત સાંભળી રહ્યા છીએ',
    Speaking: 'સેહતસાથી બોલી રહી છે',
    Reconnecting: 'ફરી જોડાઈ રહ્યા છીએ...',
    Disconnected: 'કૉલ સમાપ્ત',
  },
};

const PILL_STYLES: Record<StatusPillLabel, string> = {
  Idle: 'bg-brand-green/10 text-brand-green border-brand-green/25 dark:bg-brand-green/15 dark:text-brand-green-bright',
  Connecting: 'bg-brand-sky/10 text-brand-sky border-brand-sky/25 animate-pulse',
  Listening: 'bg-brand-green-bright/15 text-emerald-700 border-brand-green-bright/40 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40',
  Speaking: 'bg-brand-saffron/15 text-orange-800 border-brand-saffron/40 dark:bg-orange-950/60 dark:text-amber-300 dark:border-amber-500/40',
  Reconnecting: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300 animate-pulse',
  Disconnected: 'bg-muted text-muted-foreground border-border',
};

const DOT_STYLES: Record<StatusPillLabel, string> = {
  Idle: 'bg-brand-green dark:bg-brand-green-bright shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  Connecting: 'bg-brand-sky animate-ping',
  Listening: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse',
  Speaking: 'bg-brand-saffron shadow-[0_0_8px_rgba(255,153,51,0.7)] animate-pulse',
  Reconnecting: 'bg-amber-500 animate-ping',
  Disconnected: 'bg-muted-foreground/60',
};

export function StatusPill({ label, lang = 'hinglish', className }: StatusPillProps) {
  const displayText = LOCALIZED_LABELS[lang]?.[label] ?? LOCALIZED_LABELS.hinglish[label] ?? label;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-wide shadow-xs transition-all duration-300 backdrop-blur-md',
        PILL_STYLES[label],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn('size-2 shrink-0 rounded-full', DOT_STYLES[label])} />
      <span>{displayText}</span>
    </div>
  );
}
