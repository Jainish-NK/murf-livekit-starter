'use client';

import { Calendar, Info, MessageSquare, ChevronRight, Activity } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface QuickActionsProps {
  t: TranslationDictionary;
  onActionClick?: (actionType: 'appointment' | 'clinic' | 'message') => void;
  className?: string;
}

export function QuickActions({ t, onActionClick, className }: QuickActionsProps) {
  const actions = [
    {
      id: 'appointment' as const,
      icon: <Calendar className="size-4 text-saffron" />,
      chipBg: 'bg-saffron/15 text-saffron',
      title: 'Book an Appointment',
      desc: 'Request or reschedule a clinic appointment.',
    },
    {
      id: 'clinic' as const,
      icon: <Info className="size-4 text-green dark:text-green-light" />,
      chipBg: 'bg-green/15 text-green dark:text-green-light',
      title: 'Clinic Information',
      desc: 'Ask about timings, location, or services.',
    },
    {
      id: 'message' as const,
      icon: <MessageSquare className="size-4 text-brand-blue dark:text-brand-sky" />,
      chipBg: 'bg-brand-blue/15 text-brand-blue dark:text-brand-sky',
      title: 'Leave a Message',
      desc: 'Send a message to the clinic team.',
    },
  ];

  return (
    <section className={className} aria-labelledby="quick-actions-heading">
      {/* Centered Section Header with Waveform Tick Marks */}
      <div className="flex items-center justify-center gap-2 mb-3 text-navy-text dark:text-foreground">
        <Activity className="size-4 text-saffron rotate-90" aria-hidden="true" />
        <h3 id="quick-actions-heading" className="font-display text-sm font-bold tracking-tight">
          Quick Voice Actions
        </h3>
        <Activity className="size-4 text-green dark:text-green-light rotate-90" aria-hidden="true" />
      </div>

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((act) => (
          <div
            key={act.id}
            onClick={() => onActionClick?.(act.id)}
            className="group flex items-center justify-between rounded-2xl border border-border bg-surface dark:bg-card p-3.5 shadow-2xs transition-all hover:border-green/40 hover:shadow-xs cursor-pointer select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActionClick?.(act.id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${act.chipBg} mt-0.5`}>
                {act.icon}
              </span>
              <div className="text-left">
                <h4 className="font-display text-xs font-bold text-navy-text dark:text-foreground group-hover:text-green transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-gray-text mt-0.5 leading-snug">
                  {act.desc}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-text/60 group-hover:text-green group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </section>
  );
}
