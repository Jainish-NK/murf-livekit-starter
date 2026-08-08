'use client';

import { X, Mic, Calendar, Clock, MessageSquare, ShieldCheck, HeartPulse } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDictionary;
}

export function HelpModal({ isOpen, onClose, t }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-xl backdrop-blur-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-green/10 text-green dark:text-green-light font-bold text-xs">
              <HeartPulse className="size-4" />
            </span>
            <div>
              <h3 id="help-modal-title" className="font-display text-base font-bold text-foreground">
                How to use SehatSaathi AI
              </h3>
              <p className="text-xs text-muted-foreground">Virtual Receptionist Quick Guide</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-foreground/90">
          <div className="flex items-start gap-3 rounded-2xl bg-surface-mint/60 dark:bg-card p-3 border border-green/20">
            <Mic className="size-4 text-green dark:text-green-light shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">1. Just click Start & Speak Naturally</p>
              <p className="text-muted-foreground mt-0.5">
                You can speak in English, Hindi, Hinglish, or Gujarati. Say what you need without pressing extra buttons.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3 border border-border">
            <Calendar className="size-4 text-saffron shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">2. Appointment Requests</p>
              <p className="text-muted-foreground mt-0.5">
                Tell SehatSaathi your name, visit reason, date, and preferred doctor or time. SehatSaathi notes it for clinic confirmation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3 border border-border">
            <Clock className="size-4 text-green dark:text-green-light shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">3. Clinic Information</p>
              <p className="text-muted-foreground mt-0.5">
                Ask about timings (Mon–Sat 9 AM – 7 PM), doctors, or available departments (General Medicine, Pediatrics, Gynecology).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3 border border-border">
            <MessageSquare className="size-4 text-brand-blue dark:text-brand-sky shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">4. Messages for Doctors</p>
              <p className="text-muted-foreground mt-0.5">
                Leave callback messages or non-urgent queries for the doctor and front-desk team.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="rounded-2xl bg-saffron/10 p-3 border border-saffron/25 text-[11px] text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="size-4 text-saffron shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground">Medical Disclaimer:</strong> SehatSaathi is an AI receptionist and does not provide medical diagnoses or prescriptions. For emergencies, please call <strong className="text-destructive">108</strong> immediately.
          </p>
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-green hover:bg-green/90 text-white font-bold py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
