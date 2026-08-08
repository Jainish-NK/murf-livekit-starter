'use client';

import { ShieldAlert, AlertOctagon, PhoneCall } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface SafetyNoticeProps {
  t: TranslationDictionary;
  hasEmergencyKeyword?: boolean;
  className?: string;
}

export function SafetyNotice({ t, hasEmergencyKeyword, className }: SafetyNoticeProps) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Active Emergency Detected Banner */}
      {hasEmergencyKeyword && (
        <div
          role="alert"
          className="w-full rounded-3xl border-2 border-destructive bg-destructive/15 p-4 sm:p-5 text-left shadow-lg backdrop-blur-md animate-pulse"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
              <AlertOctagon className="size-6" />
            </span>
            <div className="flex-1">
              <h4 className="font-display text-sm sm:text-base font-extrabold text-destructive flex items-center gap-1.5">
                🚨 {t.safety.emergencyTitle}
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-foreground leading-relaxed">
                {t.safety.emergencyBody}
              </p>
              <div className="mt-3">
                <a
                  href="tel:108"
                  className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-all cursor-pointer"
                >
                  <PhoneCall className="size-3.5" />
                  {t.safety.call108}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Receptionist Safety Disclaimer */}
      <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-left backdrop-blur-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="size-4.5 text-brand-saffron shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">
              {t.safety.disclaimerTitle}
            </h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.safety.disclaimerBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
