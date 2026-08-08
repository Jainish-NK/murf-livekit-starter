'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Clock3, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

const HELP_ITEMS = [
  {
    icon: CalendarDays,
    title: 'Appointment booking',
    description: 'Naya appointment book karo ya existing slot change karo.',
  },
  {
    icon: Clock3,
    title: 'Clinic hours & services',
    description: 'Kab khulti hai clinic, kaunsi services available hain — poochho.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Message for the doctor',
    description: 'Doctor ke liye short message chhod sakte ho.',
  },
] as const;

interface HelpPanelProps {
  className?: string;
  defaultOpen?: boolean;
}

export function HelpPanel({ className, defaultOpen = false }: HelpPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'w-full max-w-lg overflow-hidden rounded-2xl border border-ss-navy/10 bg-white/70 backdrop-blur-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-ss-navy/5 flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none"
      >
        <span>
          <span className="font-display block text-sm font-semibold text-ss-navy">
            What I can help with
          </span>
          <span className="text-muted-foreground text-xs">
            Teen cheezein — seedha batao, main sunungi
          </span>
        </span>
        <ChevronDown
          className={cn(
            'text-ss-navy size-5 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="space-y-2 border-t border-ss-navy/10 px-3 py-3">
          {HELP_ITEMS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl bg-ss-cream/80 px-3 py-2.5"
            >
              <span className="bg-ss-teal/10 text-ss-teal mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ss-navy">{title}</span>
                <span className="text-muted-foreground text-xs leading-relaxed">{description}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
