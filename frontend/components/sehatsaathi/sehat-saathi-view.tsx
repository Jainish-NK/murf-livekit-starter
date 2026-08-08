'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionState, Track } from 'livekit-client';
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
  useTrackVolume,
  useVoiceAssistant,
  type TrackReference,
} from '@livekit/components-react';
import {
  Loader2,
  Mic,
  Lock,
  RotateCcw,
} from 'lucide-react';
import type { AppConfig } from '@/app-config';
import { BrandHeader } from '@/components/sehatsaathi/brand-header';
import { DecorativeBackground } from '@/components/sehatsaathi/decorative-background';
import { ConnectionBanner, MicBanner } from '@/components/sehatsaathi/banners';
import { VoiceOrb } from '@/components/sehatsaathi/voice-orb';
import { LiveConversationPanel } from '@/components/sehatsaathi/transcript-panel';
import { QuickActions } from '@/components/sehatsaathi/quick-actions';
import { TrustStrip } from '@/components/sehatsaathi/trust-strip';
import { Footer } from '@/components/sehatsaathi/footer';
import { useMicPermission } from '@/hooks/use-mic-permission';
import { useUiState } from '@/hooks/use-ui-state';
import {
  TRANSLATIONS,
  type SupportedLanguage,
  type TranslationDictionary,
} from '@/lib/translations';
import { cn } from '@/lib/shadcn/utils';

const CONNECT_TIMEOUT_MS = 25_000;

interface SehatSaathiViewProps {
  appConfig: AppConfig;
}

export function SehatSaathiView({ appConfig }: SehatSaathiViewProps) {
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

  const { uiState } = useUiState(
    hasStarted,
    hasEnded,
    connectionState,
    agentState
  );

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

  const orbVolume =
    uiState === 'listening' ? micVolume : uiState === 'speaking' ? agentVolume : 0;

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

  // Handle Quick Action card click
  const handleQuickAction = (_type: 'appointment' | 'clinic' | 'message') => {
    if (uiState === 'ready') {
      void startCall();
    }
  };

  // Whether call is active or ended (showing call panel)
  const isCallActive = hasStarted && uiState !== 'ready';

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col justify-between overflow-x-hidden lg:overflow-hidden bg-surface-soft dark:bg-background">
      {/* 1. Full Bleed Decorative Tricolor Background Elements */}
      <DecorativeBackground />

      {/* 2. Full-Width Sticky Header */}
      <BrandHeader
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        t={t}
      />

      {/* 3. Main View Container */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 py-2 sm:py-3 lg:py-3.5 flex-1 flex flex-col justify-center min-h-0">
        
        {/* Microphone Permission and Connection Banners */}
        <MicBanner
          status={micPermission.status}
          t={t}
          onRetry={() => void startCall()}
        />
        <ConnectionBanner
          variant={bannerVariant}
          t={t}
          onRetry={retry}
        />

        {/* Layout Conditional:
            - HOME / PRE-CALL (uiState === 'ready'): Focused, centered full home view.
            - IN-CALL / ENDED: Two-Column Active View (Left: Hero/Controls, Right: Live Conversation Panel with Start Again option).
        */}
        {!isCallActive ? (
          /* ================= HOME PAGE PROPER CONTENT ================= */
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-2.5 sm:space-y-3.5 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* 1. Small Pill Badge: Tricolor dot + VOICE FOR BHARAT */}
            <div className="inline-flex items-center gap-2 rounded-full border border-saffron/40 bg-surface dark:bg-card px-3.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold tracking-widest text-navy-text dark:text-foreground shadow-2xs">
              <span className="flex items-center gap-1 select-none">
                <span className="size-1.5 rounded-full bg-saffron inline-block" />
                <span className="size-1.5 rounded-full bg-slate-300 inline-block" />
                <span className="size-1.5 rounded-full bg-green inline-block" />
              </span>
              <span>VOICE FOR BHARAT</span>
            </div>

            {/* 2. Three-Line Heading */}
            <div className="space-y-0.5">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-navy-text dark:text-foreground leading-tight">
                Your Clinic.<br />
                Your Voice.<br />
                <span className="text-green dark:text-green-light">Your Saathi.</span>
              </h1>
              
              {/* 3. Supporting Paragraph */}
              <p className="text-xs sm:text-sm text-gray-text leading-relaxed pt-0.5 max-w-[420px] mx-auto">
                Talk naturally with SehatSaathi AI for appointments, clinic information, and messages for the clinic team.
              </p>
            </div>

            {/* 4. Voice Orb with 3D Flag Colors Round Border Movement */}
            <div className="py-1">
              <VoiceOrb uiState="ready" volume={0} size={160} />
            </div>

            {/* 5. Status Text below Orb */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-navy-text dark:text-foreground">
              <span className="size-2 rounded-full bg-green inline-block" />
              <span>Ready to talk</span>
              <span className="text-gray-text font-normal">·</span>
              <span className="text-gray-text font-normal text-xs">SehatSaathi AI is ready when you are.</span>
            </div>

            {/* 6. Primary CTA Button: Pill-shaped, saffron-to-green horizontal gradient */}
            <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center pt-0.5">
              <button
                type="button"
                onClick={() => void startCall()}
                disabled={micPermission.status === 'requesting' || isStarting}
                className="w-full inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-saffron via-[#F59E0B] to-green text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
              >
                {micPermission.status === 'requesting' || isStarting ? (
                  <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="size-4.5" aria-hidden="true" />
                )}
                <span>Start Conversation</span>
              </button>

              {/* 7. Privacy Line */}
              <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-gray-text select-none">
                <Lock className="size-3 text-gray-text shrink-0" />
                <span>Microphone access is used only for your voice conversation.</span>
              </p>
            </div>

            {/* Quick Voice Actions */}
            <div className="w-full pt-1">
              <QuickActions t={t} onActionClick={handleQuickAction} />
            </div>

            {/* Trust Strip */}
            <div className="w-full pt-0.5">
              <TrustStrip />
            </div>
          </div>
        ) : (
          /* ================= ACTIVE / ENDED CALL 2-COLUMN VIEW ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full my-auto animate-in fade-in duration-300">
            
            {/* Left Column: Compact Hero & Call Controls */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-saffron/40 bg-surface dark:bg-card px-3 py-0.5 text-[10px] font-extrabold tracking-widest text-navy-text dark:text-foreground shadow-2xs">
                <span className="flex items-center gap-1 select-none">
                  <span className="size-1.5 rounded-full bg-saffron inline-block" />
                  <span className="size-1.5 rounded-full bg-slate-300 inline-block" />
                  <span className="size-1.5 rounded-full bg-green inline-block" />
                </span>
                <span>VOICE FOR BHARAT</span>
              </div>

              {/* Heading */}
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-text dark:text-foreground leading-tight">
                Your Clinic.<br />
                Your Voice.<br />
                <span className="text-green dark:text-green-light">Your Saathi.</span>
              </h2>

              {/* Voice Orb with 3D Flag movement */}
              <div className="py-2">
                <VoiceOrb uiState={uiState} volume={orbVolume} size={150} />
              </div>

              {/* Status text */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span
                    className={cn(
                      'size-2.5 rounded-full',
                      uiState === 'listening'
                        ? 'bg-green animate-pulse'
                        : uiState === 'speaking'
                          ? 'bg-saffron animate-pulse'
                          : uiState === 'ended'
                            ? 'bg-gray-text'
                            : 'bg-brand-sky animate-ping'
                    )}
                  />
                  <span className="font-display text-sm font-bold text-navy-text dark:text-foreground">
                    {uiState === 'connecting' && 'Connecting to SehatSaathi AI...'}
                    {uiState === 'listening' && 'Listening to you'}
                    {uiState === 'speaking' && 'SehatSaathi is speaking'}
                    {uiState === 'ended' && 'Call ended — the conversation is over'}
                  </span>
                </div>
                <p className="text-xs text-gray-text">
                  {uiState === 'connecting' && 'Please wait while we connect your voice session.'}
                  {uiState === 'listening' && 'Go ahead, I am listening.'}
                  {uiState === 'speaking' && 'I am responding to you.'}
                  {uiState === 'ended' && 'Thank you for talking with SehatSaathi AI.'}
                </p>
              </div>

              {/* Call Control Buttons */}
              <div className="w-full max-w-xs flex flex-col items-center lg:items-start pt-1">
                {(uiState === 'listening' || uiState === 'speaking' || uiState === 'connecting') && (
                  <button
                    type="button"
                    onClick={() => void endCall()}
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger-red hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>End Conversation</span>
                  </button>
                )}

                {uiState === 'ended' && (
                  <button
                    type="button"
                    onClick={resetToReady}
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-saffron via-[#F59E0B] to-green text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <RotateCcw className="size-4" />
                    <span>Start Again</span>
                  </button>
                )}

                {/* Privacy Line */}
                <p className="mt-2 flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-text select-none">
                  <Lock className="size-3 text-gray-text shrink-0" />
                  <span>Microphone used only for your voice session.</span>
                </p>
              </div>
            </div>

            {/* Right Column: Live Conversation Panel with Start Again support */}
            <div className="lg:col-span-7 w-full h-[400px] sm:h-[440px] lg:h-[460px] flex flex-col">
              <LiveConversationPanel
                messages={messages}
                uiState={uiState}
                volume={orbVolume}
                timerSeconds={timerSeconds}
                onEndCall={() => void endCall()}
                onStartAgain={resetToReady}
                onBack={resetToReady}
                className="w-full h-full"
              />
            </div>

          </div>
        )}

      </main>

      {/* 4. Full-Width Footer */}
      <Footer className="py-2 sm:py-2.5 shrink-0" />
    </div>
  );
}
