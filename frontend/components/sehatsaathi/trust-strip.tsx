'use client';

import { Mic, Languages, ClipboardCheck, ShieldCheck } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface TrustStripProps {
  t?: TranslationDictionary;
  className?: string;
}

export function TrustStrip({ className }: TrustStripProps) {
  const items = [
    {
      icon: <Mic className="size-3.5 text-saffron" />,
      chipBg: 'bg-saffron/15 text-saffron',
      title: 'Voice-First Access',
      desc: 'Hands-free, natural voice interaction.',
    },
    {
      icon: <Languages className="size-3.5 text-green dark:text-green-light" />,
      chipBg: 'bg-green/15 text-green dark:text-green-light',
      title: 'Multilingual & Hinglish',
      desc: 'Understands English, Hindi, Hinglish & Gujarati.',
    },
    {
      icon: <ClipboardCheck className="size-3.5 text-brand-blue dark:text-brand-sky" />,
      chipBg: 'bg-brand-blue/15 text-brand-blue dark:text-brand-sky',
      title: 'Accurate Coordination',
      desc: 'Records your requests and shares with clinic staff.',
    },
    {
      icon: <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
      chipBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      title: 'Strict Medical Safety',
      desc: 'No medical advice or diagnosis. Safety always comes first.',
    },
  ];

  return (
    <div
      className={`w-full rounded-2xl border border-border bg-surface/70 dark:bg-card/70 px-4 py-3.5 backdrop-blur-xs ${className}`}
      aria-labelledby="trust-strip-label"
    >
      <span id="trust-strip-label" className="sr-only">
        Trust & Safety Highlights
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${i > 0 ? 'pt-2.5 sm:pt-0 sm:pl-3' : ''}`}
          >
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${item.chipBg} mt-0.5`}>
              {item.icon}
            </span>
            <div className="text-left">
              <h4 className="font-display text-xs font-bold text-navy-text dark:text-foreground">
                {item.title}
              </h4>
              <p className="text-[11px] text-gray-text leading-tight mt-0.5">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
