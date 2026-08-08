'use client';

import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpPanel } from '@/components/sehatsaathi/help-panel';
import { VoiceOrb } from '@/components/sehatsaathi/voice-orb';
import { TrustStrip } from '@/components/sehatsaathi/trust-strip';

interface WelcomeViewProps {
  startButtonText: string;
  tagline?: string;
  companyName?: string;
  onStartCall: () => void;
}

/** Legacy welcome surface — kept for compatibility; primary UI is SehatSaathiView. */
export const WelcomeView = ({
  startButtonText,
  tagline = 'Voice for Bharat Edition',
  companyName = 'SehatSaathi AI',
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="flex min-h-svh flex-col items-center justify-center px-4 pb-20">
      <section className="flex flex-col items-center justify-center text-center">
        <VoiceOrb uiState="ready" />
        <h1 className="font-display mt-4 text-3xl font-bold text-brand-ink dark:text-foreground">{companyName}</h1>
        <p className="font-display mt-1 text-lg text-brand-saffron">{tagline}</p>
        <p className="text-muted-foreground mt-2 max-w-prose text-base leading-relaxed">
          AI Clinic Receptionist — Speak naturally in Hindi, English, or Hinglish.
        </p>

        <Button
          size="lg"
          onClick={onStartCall}
          className="bg-brand-saffron hover:bg-brand-saffron/90 mt-6 min-h-12 w-64 rounded-2xl text-base font-semibold text-white"
        >
          <Mic className="size-5" aria-hidden />
          {startButtonText}
        </Button>

        <HelpPanel className="mt-6" />
      </section>

      <TrustStrip />
    </div>
  );
};
