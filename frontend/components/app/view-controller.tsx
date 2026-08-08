'use client';

import type { AppConfig } from '@/app-config';
import { SehatSaathiView } from '@/components/sehatsaathi/sehat-saathi-view';

interface ViewControllerProps {
  appConfig: AppConfig;
}

/**
 * SehatSaathi view controller — single state machine UI.
 * LiveKit session wiring stays in App / AgentSessionProvider.
 */
export function ViewController({ appConfig }: ViewControllerProps) {
  return <SehatSaathiView appConfig={appConfig} />;
}
