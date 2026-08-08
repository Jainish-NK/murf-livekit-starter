'use client';

import { Building2, Clock, Stethoscope, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { TranslationDictionary } from '@/lib/translations';

interface ClinicInfoCardProps {
  t: TranslationDictionary;
  className?: string;
}

export function ClinicInfoCard({ t, className }: ClinicInfoCardProps) {
  return (
    <section
      className={`rounded-3xl border border-border/80 bg-card/70 p-5 sm:p-6 shadow-sm backdrop-blur-md transition-all ${className}`}
      aria-labelledby="clinic-info-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green dark:text-brand-green-bright border border-brand-green/20">
            <Building2 className="size-5" />
          </span>
          <div>
            <h3 id="clinic-info-heading" className="font-display text-base sm:text-lg font-bold text-foreground">
              {t.clinicCard.name}
            </h3>
            <p className="text-xs text-muted-foreground">Virtual Reception Desk · SehatSaathi AI</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green dark:text-brand-green-bright border border-brand-green/20">
          <CheckCircle2 className="size-3.5" />
          Verified Clinic Data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timings */}
        <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4 border border-border/50">
          <Clock className="size-5 text-brand-saffron shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t.clinicCard.hoursLabel}
            </h4>
            <p className="text-sm font-semibold text-foreground">
              {t.clinicCard.hoursValue}
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4 border border-border/50">
          <Stethoscope className="size-5 text-brand-green dark:text-brand-green-bright shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t.clinicCard.servicesLabel}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {t.clinicCard.servicesList.map((srv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-background px-2 py-0.5 text-xs font-medium text-foreground border border-border/60"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Honest Receptionist Disclaimer */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-green/5 dark:bg-brand-green/10 p-3 border border-brand-green/15 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-brand-green dark:text-brand-green-bright mt-0.5" />
        <p className="leading-relaxed">{t.clinicCard.disclaimer}</p>
      </div>
    </section>
  );
}
