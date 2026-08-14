'use client';

import { Activity, Calendar, ChevronRight, Info, MessageSquare } from 'lucide-react';
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
      icon: <Calendar className="text-saffron size-4" />,
      chipBg: 'bg-saffron/15 text-saffron',
      title: 'Book an Appointment',
      desc: 'Request or reschedule a clinic appointment.',
    },
    {
      id: 'clinic' as const,
      icon: <Info className="text-green dark:text-green-light size-4" />,
      chipBg: 'bg-green/15 text-green dark:text-green-light',
      title: 'Clinic Information',
      desc: 'Ask about timings, location, or services.',
    },
    {
      id: 'message' as const,
      icon: <MessageSquare className="text-brand-blue dark:text-brand-sky size-4" />,
      chipBg: 'bg-brand-blue/15 text-brand-blue dark:text-brand-sky',
      title: 'Leave a Message',
      desc: 'Send a message to the clinic team.',
    },
  ];

  return (
    <section className={className} aria-labelledby="quick-actions-heading">
      {/* Centered Section Header with Waveform Tick Marks */}
      <div className="text-navy-text dark:text-foreground mb-3 flex items-center justify-center gap-2">
        <Activity className="text-saffron size-4 rotate-90" aria-hidden="true" />
        <h3 id="quick-actions-heading" className="font-display text-sm font-bold tracking-tight">
          Quick Voice Actions
        </h3>
        <Activity
          className="text-green dark:text-green-light size-4 rotate-90"
          aria-hidden="true"
        />
      </div>

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((act) => (
          <div
            key={act.id}
            onClick={() => onActionClick?.(act.id)}
            className="group border-border bg-surface dark:bg-card hover:border-green/40 flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 shadow-2xs transition-all select-none hover:shadow-xs"
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
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${act.chipBg} mt-0.5`}
              >
                {act.icon}
              </span>
              <div className="text-left">
                <h4 className="font-display text-navy-text dark:text-foreground group-hover:text-green text-xs font-bold transition-colors">
                  {act.title}
                </h4>
                <p className="text-gray-text mt-0.5 text-[11px] leading-snug">{act.desc}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-text/60 group-hover:text-green ml-2 size-4 shrink-0 transition-all group-hover:translate-x-0.5" />
          </div>
        ))}
      </div>
    </section>
  );
}
