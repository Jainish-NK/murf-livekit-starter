'use client';

import { CheckCircle, Info } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface RequestGuideProps {
  t: TranslationDictionary;
  className?: string;
}

export function RequestGuide({ t, className }: RequestGuideProps) {
  const steps = [
    { num: '1', title: t.requestGuide.step1, desc: 'Your full name' },
    { num: '2', title: t.requestGuide.step2, desc: 'General reason for checkup' },
    { num: '3', title: t.requestGuide.step3, desc: 'Preferred visit date' },
    { num: '4', title: t.requestGuide.step4, desc: 'Morning or evening slot' },
    { num: '5', title: t.requestGuide.step5, desc: 'Doctor or department' },
  ];

  return (
    <section
      className={`rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs backdrop-blur-xs ${className}`}
      aria-labelledby="request-guide-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-saffron/10 text-brand-saffron font-bold text-xs">
          📋
        </span>
        <h3 id="request-guide-heading" className="font-display text-sm sm:text-base font-bold text-foreground">
          {t.requestGuide.title}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {steps.map((st, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl bg-background/80 p-3 border border-border/50 text-left transition-all hover:border-brand-green/30"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-green/10 text-brand-green dark:text-brand-green-bright text-[10px] font-extrabold">
                {st.num}
              </span>
              <CheckCircle className="size-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-bold text-foreground truncate">{st.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{st.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/30">
        <Info className="size-3.5 text-brand-saffron shrink-0 mt-0.5" />
        <p>{t.requestGuide.note}</p>
      </div>
    </section>
  );
}
