'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionState, Track } from 'livekit-client';
import { RotateCcw } from 'lucide-react';
import {
  type TrackReference,
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
  useTrackVolume,
  useVoiceAssistant,
} from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ConnectionBanner, MicBanner } from '@/components/sehatsaathi/banners';
import { PremiumLanding } from '@/components/sehatsaathi/premium-landing';
import { LiveConversationPanel } from '@/components/sehatsaathi/transcript-panel';
import { useMicPermission } from '@/hooks/use-mic-permission';
import { useUiState } from '@/hooks/use-ui-state';
import { cn } from '@/lib/shadcn/utils';
import {
  type SupportedLanguage,
  TRANSLATIONS,
  type TranslationDictionary,
} from '@/lib/translations';

const CONNECT_TIMEOUT_MS = 25_000;

interface SehatSaathiViewProps {
  appConfig: AppConfig;
}

export function SehatSaathiView({ appConfig: _appConfig }: SehatSaathiViewProps) {
  const session = useSessionContext();
  const agent = useAgent();
  const { state: voiceState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const { messages } = useSessionMessages(session);
  const { localParticipant } = useLocalParticipant();
  const micPermission = useMicPermission();

  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const t: TranslationDictionary = TRANSLATIONS[currentLang] ?? TRANSLATIONS.en;

  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [bannerVariant, setBannerVariant] = useState<'reconnecting' | 'error' | 'timeout' | null>(
    null
  );

  // Call Duration Timer
  const [timerSeconds, setTimerSeconds] = useState(0);

  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalEndRef = useRef(false);

  const connectionState = session.connectionState;
  const agentState = agent.state ?? voiceState;

  const { uiState } = useUiState(hasStarted, hasEnded, connectionState, agentState);

  // Timer Tick Hook
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (uiState === 'listening' || uiState === 'speaking') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (uiState === 'ready' || uiState === 'connecting') {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uiState]);

  // Local Microphone Track
  const localMicTrack = useMemo<TrackReference | undefined>(() => {
    if (session.isConnected && session.local.microphoneTrack) {
      return session.local.microphoneTrack;
    }
    const publication = localParticipant?.getTrackPublication(Track.Source.Microphone);
    if (!publication || !localParticipant) return undefined;
    return {
      source: Track.Source.Microphone,
      participant: localParticipant,
      publication,
    };
  }, [session, localParticipant]);

  const micVolume = useTrackVolume(localMicTrack, {
    fftSize: 512,
    smoothingTimeConstant: 0.6,
  });
  const agentVolume = useTrackVolume(agentAudioTrack, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });

  const orbVolume = uiState === 'listening' ? micVolume : uiState === 'speaking' ? agentVolume : 0;

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  // Clear timeout once active session is established
  useEffect(() => {
    if (uiState === 'listening' || uiState === 'speaking') {
      clearConnectTimeout();
      setIsStarting(false);
      if (bannerVariant === 'timeout') setBannerVariant(null);
    }
  }, [uiState, clearConnectTimeout, bannerVariant]);

  // Reconnecting banner trigger
  useEffect(() => {
    if (
      hasStarted &&
      !hasEnded &&
      (connectionState === ConnectionState.Reconnecting ||
        connectionState === ConnectionState.SignalReconnecting)
    ) {
      setBannerVariant('reconnecting');
      return;
    }

    if (bannerVariant === 'reconnecting') {
      setBannerVariant(null);
    }
  }, [connectionState, hasStarted, hasEnded, bannerVariant]);

  // Unexpected disconnect mid-call
  useEffect(() => {
    if (!hasStarted || hasEnded || intentionalEndRef.current) return;

    if (
      connectionState === ConnectionState.Disconnected &&
      uiState !== 'ready' &&
      uiState !== 'connecting'
    ) {
      setHasEnded(true);
      setBannerVariant('error');
    }
  }, [connectionState, hasStarted, hasEnded, uiState]);

  // Agent failure hook
  useEffect(() => {
    if (agentState === 'failed' && hasStarted) {
      clearConnectTimeout();
      setHasEnded(true);
      setIsStarting(false);
      setBannerVariant('error');
    }
  }, [agentState, hasStarted, clearConnectTimeout]);

  // End Call handler
  const endCall = useCallback(async () => {
    intentionalEndRef.current = true;
    clearConnectTimeout();
    setIsStarting(false);
    try {
      await session.end();
    } catch {
      // ignore end errors
    }
    setHasEnded(true);
    setBannerVariant(null);
  }, [session, clearConnectTimeout]);

  // Reset to Ready state
  const resetToReady = useCallback(() => {
    intentionalEndRef.current = false;
    clearConnectTimeout();
    setHasStarted(false);
    setHasEnded(false);
    setIsStarting(false);
    setBannerVariant(null);
    micPermission.reset();
  }, [clearConnectTimeout, micPermission]);

  // Start call handler
  const startCall = useCallback(async () => {
    setBannerVariant(null);
    intentionalEndRef.current = false;

    const permission = await micPermission.request();
    if (!permission.ok) {
      return;
    }

    setHasEnded(false);
    setHasStarted(true);
    setIsStarting(true);

    clearConnectTimeout();
    connectTimeoutRef.current = setTimeout(() => {
      setBannerVariant('timeout');
      setIsStarting(false);
      intentionalEndRef.current = true;
      void session.end().catch(() => undefined);
      setHasEnded(true);
    }, CONNECT_TIMEOUT_MS);

    try {
      await session.start({
        tracks: {
          microphone: { enabled: true },
          camera: { enabled: false },
          screenShare: { enabled: false },
        },
      });
    } catch {
      clearConnectTimeout();
      setIsStarting(false);
      setHasEnded(true);
      setBannerVariant('error');
    }
  }, [micPermission, session, clearConnectTimeout]);

  const retry = useCallback(async () => {
    intentionalEndRef.current = false;
    clearConnectTimeout();
    setBannerVariant(null);
    setHasEnded(false);
    micPermission.reset();

    const permission = await micPermission.request();
    if (!permission.ok) {
      setHasStarted(false);
      return;
    }

    setHasStarted(true);
    setIsStarting(true);

    connectTimeoutRef.current = setTimeout(() => {
      setBannerVariant('timeout');
      setIsStarting(false);
      intentionalEndRef.current = true;
      void session.end().catch(() => undefined);
      setHasEnded(true);
    }, CONNECT_TIMEOUT_MS);

    try {
      await session.start({
        tracks: {
          microphone: { enabled: true },
          camera: { enabled: false },
          screenShare: { enabled: false },
        },
      });
    } catch {
      clearConnectTimeout();
      setIsStarting(false);
      setHasEnded(true);
      setBannerVariant('error');
    }
  }, [clearConnectTimeout, micPermission, session]);

  useEffect(() => {
    return () => clearConnectTimeout();
  }, [clearConnectTimeout]);

  // Whether call is active or ended (showing call panel)
  const isCallActive = hasStarted && uiState !== 'ready';

  if (!isCallActive) {
    return (
      <PremiumLanding
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        t={t}
        onStartCall={() => void startCall()}
        isStartingCall={micPermission.status === 'requesting' || isStarting}
        micStatus={micPermission.status}
        bannerVariant={bannerVariant}
        onRetryMic={retry}
      />
    );
  }

  const isErrorState = bannerVariant === 'error' || bannerVariant === 'timeout';

  return (
    <div
      className={cn(
        'relative flex min-h-screen w-full flex-col items-center justify-center bg-[#FAFAFC] p-4 transition-colors duration-300 sm:p-6 lg:p-8 dark:bg-[#0B131B]'
      )}
    >
      {/* Microphone Permission and Connection Banners */}
      <div className="relative z-35 w-full max-w-7xl">
        <MicBanner
          status={micPermission.status}
          t={t}
          onRetry={() => void startCall()}
          className="mb-4"
        />
        <ConnectionBanner variant={bannerVariant} t={t} onRetry={retry} className="mb-4" />
      </div>

      {/* ================= UNIFIED TELEHEALTH CONSOLE WORKSPACE ================= */}
      <div className="animate-in fade-in relative z-20 my-auto grid min-h-[580px] w-full max-w-7xl grid-cols-1 overflow-hidden rounded-[28px] border border-[#E5EAF0] bg-white/80 shadow-2xl backdrop-blur-md duration-300 lg:h-[620px] lg:grid-cols-12 dark:border-slate-800 dark:bg-[#131F2B]/90">
        {/* Left Column: Diagnostics & Voice Telemetry Pane (4.5/12) */}
        <div className="flex h-full flex-col justify-between gap-6 border-r border-[#E5EAF0] bg-[#FAF9F6]/20 p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900/10">
          {/* Header Block */}
          <div className="flex w-full items-center justify-between select-none">
            <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-[10px] font-bold tracking-widest text-[#0FAF9F] uppercase dark:bg-[#0FAF9F]/10">
              AI Voice Terminal
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'size-2 rounded-full',
                  uiState === 'listening' && 'animate-ping bg-[#0FAF9F]',
                  uiState === 'speaking' && 'animate-ping bg-[#7C6FF0]',
                  uiState === 'connecting' && 'animate-pulse bg-amber-400',
                  uiState === 'ended' && 'bg-slate-300',
                  isErrorState && 'animate-pulse bg-rose-500'
                )}
              />
              <span className="dark:text-slate-450 text-[10px] font-bold text-[#64748B] uppercase">
                {uiState === 'listening' && 'Listening'}
                {uiState === 'speaking' && 'Speaking'}
                {uiState === 'connecting' && 'Connecting'}
                {uiState === 'ended' && 'Call Ended'}
                {isErrorState && 'Network Error'}
              </span>
            </div>
          </div>

          {/* Glowing Front Face Robot with Sonic Concentric Circles (2nd Image Type Ripple) */}
          <div className="relative mx-auto my-6 flex size-[260px] items-center justify-center select-none sm:size-[300px]">
            {/* Layer 5 (Outermost, largest) */}
            <div
              style={{ transform: `scale(${1 + orbVolume * 0.4})` }}
              className={cn(
                'absolute size-[240px] rounded-full opacity-0 transition-all duration-100 ease-out sm:size-[280px]',
                uiState === 'speaking' && 'bg-indigo-500/10 opacity-100 dark:bg-indigo-500/15',
                uiState === 'listening' && 'bg-[#0FAF9F]/10 opacity-100 dark:bg-[#0FAF9F]/15'
              )}
            />

            {/* Layer 4 */}
            <div
              style={{ transform: `scale(${1 + orbVolume * 0.3})` }}
              className={cn(
                'absolute size-[200px] rounded-full opacity-0 transition-all duration-100 ease-out sm:size-[230px]',
                uiState === 'speaking' && 'bg-indigo-400/25 opacity-100 dark:bg-indigo-400/30',
                uiState === 'listening' && 'bg-[#0FAF9F]/25 opacity-100 dark:bg-[#0FAF9F]/30'
              )}
            />

            {/* Layer 3 */}
            <div
              style={{ transform: `scale(${1 + orbVolume * 0.2})` }}
              className={cn(
                'absolute size-[160px] rounded-full opacity-0 transition-all duration-100 ease-out sm:size-[185px]',
                uiState === 'speaking' && 'bg-indigo-300/45 opacity-100 dark:bg-indigo-300/50',
                uiState === 'listening' && 'bg-[#0FAF9F]/45 opacity-100 dark:bg-[#0FAF9F]/50'
              )}
            />

            {/* Layer 2 */}
            <div
              style={{ transform: `scale(${1 + orbVolume * 0.1})` }}
              className={cn(
                'absolute size-[120px] rounded-full opacity-0 transition-all duration-100 ease-out sm:size-[140px]',
                uiState === 'speaking' && 'bg-indigo-200/70 opacity-100 dark:bg-indigo-200/75',
                uiState === 'listening' && 'bg-[#0FAF9F]/70 opacity-100 dark:bg-[#0FAF9F]/75'
              )}
            />

            {/* Central avatar container */}
            <div
              className={cn(
                'relative z-10 flex size-[90px] items-center justify-center overflow-hidden rounded-full border bg-white p-2 shadow-md transition-all sm:size-[105px] dark:bg-slate-900',
                uiState === 'speaking' && 'border-indigo-400 shadow-indigo-500/20',
                uiState === 'listening' && 'border-[#0FAF9F] shadow-[#0FAF9F]/20',
                isErrorState && 'border-rose-500 shadow-rose-500/20',
                uiState === 'connecting' && 'border-amber-400 shadow-amber-500/20'
              )}
            >
              <img
                src="/Front_Robo_For_Voice_dashboard.png"
                alt="SehatSaathi Front AI Robot"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Diagnostics details & Status Button */}
          <div className="w-full space-y-4">
            <div className="shadow-3xs grid w-full grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-0.5">
                <span className="block text-[9px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                  Security
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span className="size-1 rounded-full bg-[#0FAF9F]" />
                  <span>AES-256</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                  Codec
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span className="size-1 rounded-full bg-[#0FAF9F]" />
                  <span>Opus VBR</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                  Network Node
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span className="size-1 rounded-full bg-[#0FAF9F]" />
                  <span>Asia-South</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                  Model Target
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span className="size-1 rounded-full bg-[#0FAF9F]" />
                  <span>Saathi-Voice-v2</span>
                </span>
              </div>
            </div>

            {/* Status Retry Block */}
            {(isErrorState || uiState === 'ended') && (
              <div className="flex w-full flex-col items-center">
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#0FAF9F] px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-102 hover:bg-[#0d9688]"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{isErrorState ? 'Try Connection Again' : 'Restart Session'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Conversation Card Panel (7.5/12) */}
        <div className="flex h-full flex-col bg-white lg:col-span-7 dark:bg-[#131F2B]/40">
          <LiveConversationPanel
            messages={messages}
            uiState={uiState}
            volume={orbVolume}
            timerSeconds={timerSeconds}
            onEndCall={() => void endCall()}
            onStartAgain={resetToReady}
            onBack={resetToReady}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
