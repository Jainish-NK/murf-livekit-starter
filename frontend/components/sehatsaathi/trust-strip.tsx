'use client';

import { ClipboardCheck, Languages, Mic, ShieldCheck } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface TrustStripProps {
  t?: TranslationDictionary;
  className?: string;
}

export function TrustStrip({ className }: TrustStripProps) {
  const items = [
    {
      icon: <Mic className="text-saffron size-3.5" />,
      chipBg: 'bg-saffron/15 text-saffron',
      title: 'Voice-First Access',
      desc: 'Hands-free, natural voice interaction.',
    },
    {
      icon: <Languages className="text-green dark:text-green-light size-3.5" />,
      chipBg: 'bg-green/15 text-green dark:text-green-light',
      title: 'Multilingual & Hinglish',
      desc: 'Understands English, Hindi, Hinglish & Gujarati.',
    },
    {
      icon: <ClipboardCheck className="text-brand-blue dark:text-brand-sky size-3.5" />,
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
      className={`border-border bg-surface/70 dark:bg-card/70 w-full rounded-2xl border px-4 py-3.5 backdrop-blur-xs ${className}`}
      aria-labelledby="trust-strip-label"
    >
      <span id="trust-strip-label" className="sr-only">
        Trust & Safety Highlights
      </span>

      <div className="divide-border/60 grid grid-cols-1 gap-3 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${i > 0 ? 'pt-2.5 sm:pt-0 sm:pl-3' : ''}`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${item.chipBg} mt-0.5`}
            >
              {item.icon}
            </span>
            <div className="text-left">
              <h4 className="font-display text-navy-text dark:text-foreground text-xs font-bold">
                {item.title}
              </h4>
              <p className="text-gray-text mt-0.5 text-[11px] leading-tight">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
