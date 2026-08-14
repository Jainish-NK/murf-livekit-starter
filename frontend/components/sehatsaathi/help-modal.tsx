'use client';

import {
  AlertTriangle,
  Calendar,
  Clock,
  HeartPulse,
  MessageSquare,
  Mic,
  ShieldCheck,
  X,
} from 'lucide-react';
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
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="border-border bg-card relative w-full max-w-lg space-y-4 rounded-3xl border p-6 shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-green/10 text-green dark:text-green-light flex size-8 items-center justify-center rounded-xl text-xs font-bold">
              <HeartPulse className="size-4" />
            </span>
            <div>
              <h3
                id="help-modal-title"
                className="font-display text-foreground text-base font-bold"
              >
                How to use SehatSaathi AI
              </h3>
              <p className="text-muted-foreground text-xs">
                Virtual Receptionist & Health Access Guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="text-foreground/90 max-h-[60vh] space-y-3 overflow-y-auto pr-1 text-xs">
          <div className="bg-surface-mint/60 dark:bg-card border-green/20 flex items-start gap-3 rounded-2xl border p-3">
            <Mic className="text-green dark:text-green-light mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-foreground font-bold">1. Just click Start & Speak Naturally</p>
              <p className="text-muted-foreground mt-0.5">
                You can speak in English, Hindi, Hinglish, or Gujarati. Say what you need without
                pressing extra buttons.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 border-border flex items-start gap-3 rounded-2xl border p-3">
            <Calendar className="text-saffron mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-foreground font-bold">2. Appointment Requests</p>
              <p className="text-muted-foreground mt-0.5">
                Tell SehatSaathi your name, visit reason, date, and preferred doctor or time.
                SehatSaathi notes it for clinic confirmation.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 border-border flex items-start gap-3 rounded-2xl border p-3">
            <Clock className="text-green dark:text-green-light mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-foreground font-bold">3. Clinic Information & Facility Lookup</p>
              <p className="text-muted-foreground mt-0.5">
                Ask about timings (Mon–Sat 9 AM – 7 PM), doctors, or nearby PHCs/hospitals across
                your locality or district.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 border-border flex items-start gap-3 rounded-2xl border p-3">
            <MessageSquare className="text-brand-blue dark:text-brand-sky mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-foreground font-bold">4. Messages for Doctors</p>
              <p className="text-muted-foreground mt-0.5">
                Leave callback messages or non-urgent queries for the doctor and front-desk team.
              </p>
            </div>
          </div>

          <div className="bg-destructive/10 border-destructive/20 flex items-start gap-3 rounded-2xl border p-3">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-foreground font-bold">5. Human Healthcare Escalation (Day 7)</p>
              <p className="text-muted-foreground mt-0.5">
                If emergency symptoms (e.g. chest pain) or diagnosis requests are detected,
                SehatSaathi asks for your explicit permission to create a structured human
                escalation with a unique Reference ID (e.g. ESC-2026-001) dispatched to the clinic
                support team via email.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="bg-saffron/10 border-saffron/25 text-muted-foreground flex items-start gap-2 rounded-2xl border p-3 text-[11px]">
          <ShieldCheck className="text-saffron mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="text-foreground">Medical Disclaimer:</strong> SehatSaathi is an AI
            receptionist and does not provide medical diagnoses or prescriptions. For emergencies,
            please call <strong className="text-destructive">108</strong> immediately.
          </p>
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={onClose}
          className="bg-green hover:bg-green/90 w-full cursor-pointer rounded-xl py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
