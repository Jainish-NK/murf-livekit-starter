'use client';

import { useEffect, useRef } from 'react';
import {
  Activity,
  ChevronLeft,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocalParticipant } from '@livekit/components-react';
import type { ReceivedMessage } from '@livekit/components-react';
import { VoiceVisualizer } from '@/components/sehatsaathi/voice-visualizer';
import type { UIState } from '@/hooks/use-ui-state';
import { cn } from '@/lib/shadcn/utils';

interface LiveConversationPanelProps {
  messages: ReceivedMessage[];
  uiState: UIState;
  volume?: number;
  timerSeconds?: number;
  onEndCall?: () => void;
  onStartAgain?: () => void;
  onBack?: () => void;
  className?: string;
}

export function LiveConversationPanel({
  messages,
  uiState,
  volume = 0,
  timerSeconds = 0,
  onEndCall,
  onStartAgain,
  onBack,
  className,
}: LiveConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { localParticipant } = useLocalParticipant();

  // Auto-scroll to bottom as new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const isSpeaking = uiState === 'speaking';
  const isListening = uiState === 'listening';
  const isConnecting = uiState === 'connecting';
  const isEnded = uiState === 'ended';

  // Determine microphone enabled status from local participant
  const isMicEnabled = localParticipant ? localParticipant.isMicrophoneEnabled : true;

  const toggleMute = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
    } catch (err) {
      console.error('Failed to toggle microphone state:', err);
    }
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex h-full min-h-[460px] w-full flex-col select-none">
      {/* Main Conversation Card Container */}
      <div
        className={cn(
          'relative flex flex-1 flex-col overflow-hidden bg-transparent transition-all',
          className
        )}
      >
        {/* 1. Header (Conversation icon, title, end call red button) */}
        <div className="flex items-center justify-between border-b border-[#E5EAF0] bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#131F2B]">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="cursor-pointer rounded-lg p-1 text-[#64748B] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Back"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <MessageSquare className="size-4.5 text-[#0FAF9F]" />
            <h3 className="font-display text-sm font-extrabold text-[#14213D] dark:text-white">
              Live Conversation
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Call duration timer display */}
            {!isEnded && !isConnecting && (
              <div className="dark:text-slate-350 flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800">
                <span className="size-1.5 animate-pulse rounded-full bg-[#0FAF9F]" />
                <span>{formatDuration(timerSeconds)}</span>
              </div>
            )}

            {/* End Conversation Button */}
            {onEndCall && !isEnded && (
              <button
                type="button"
                onClick={onEndCall}
                className="inline-flex min-h-8.5 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#EF4444] px-4 py-1 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.02] hover:bg-red-600 active:scale-[0.98]"
              >
                <PhoneOff className="size-3.5" />
                <span>End Conversation</span>
              </button>
            )}

            {isEnded && onStartAgain && (
              <button
                type="button"
                onClick={onStartAgain}
                className="inline-flex min-h-8.5 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#0FAF9F] px-4 py-1 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.02] hover:bg-[#0d9688] active:scale-[0.98]"
              >
                <RotateCcw className="size-3.5" />
                <span>Start Again</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Connection Status Banner */}
        <div className="flex flex-col items-center justify-center space-y-1 border-b border-[#E5EAF0]/40 bg-white pt-4 pb-3 text-center dark:border-slate-800/40 dark:bg-[#131F2B]">
          {isConnecting && (
            <>
              <div className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-[#0FAF9F]/25 bg-[#E9F7F4] px-3.5 py-1 text-[11px] font-bold text-[#0FAF9F]">
                <span className="inline-block size-2 shrink-0 animate-spin rounded-full border-2 border-[#0FAF9F] border-t-transparent" />
                <span>Connecting session...</span>
              </div>
              <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                Connecting to virtual assistant receptionist
              </p>
            </>
          )}
          {isListening && (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#0FAF9F]/25 bg-[#E9F7F4] px-3.5 py-1 text-[11px] font-bold text-[#0FAF9F]">
                <Mic className="size-3.5 animate-pulse text-[#0FAF9F]" />
                <span>Listening...</span>
              </div>
              <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                {isMicEnabled
                  ? 'Go ahead, speak naturally to SehatSaathi AI'
                  : 'Microphone is currently muted'}
              </p>
            </>
          )}
          {isSpeaking && (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7C6FF0]/25 bg-[#7C6FF0]/10 px-3.5 py-1 text-[11px] font-bold text-[#7C6FF0]">
                <Activity className="size-3.5 animate-pulse text-[#7C6FF0]" />
                <span>Speaking...</span>
              </div>
              <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                SehatSaathi is speaking
              </p>
            </>
          )}
          {isEnded && (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 text-[11px] font-bold text-[#64748B] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <span>Disconnected</span>
              </div>
              <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                The call has been disconnected.
              </p>
            </>
          )}
        </div>

        {/* 3. Transcript Feed */}
        <div
          ref={scrollerRef}
          className="custom-scrollbar max-h-[220px] flex-1 space-y-4 overflow-y-auto bg-white px-5 py-4 sm:max-h-[280px] dark:bg-[#131F2B]"
          aria-live="polite"
          aria-relevant="additions"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center py-10 text-center"
              >
                <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl border border-[#0FAF9F]/10 bg-[#E9F7F4] text-[#0FAF9F]">
                  <MessageSquare className="size-6 text-[#0FAF9F]" />
                  <Sparkles className="absolute -top-1.5 -right-1.5 size-3.5 animate-pulse text-[#0FAF9F]" />
                </div>
                <h4 className="font-display text-sm font-extrabold text-[#14213D] dark:text-white">
                  No messages yet
                </h4>
                <p className="mt-1 max-w-[280px] text-[11px] leading-relaxed font-semibold text-[#64748B] sm:text-xs dark:text-slate-400">
                  Speak naturally with SehatSaathi — your live transcript will appear right here.
                </p>
              </motion.div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.from?.isLocal === true;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    {/* Small Circular Avatar */}
                    <div
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        isUser
                          ? 'border-slate-200 bg-slate-100 text-[#64748B]'
                          : 'border-[#0FAF9F]/20 bg-[#E9F7F4] text-[#0FAF9F]'
                      )}
                    >
                      {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
                    </div>

                    {/* Message Bubble + Header */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#14213D] dark:text-white">
                          {isUser ? 'You' : 'SehatSaathi AI'}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-slate-500">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl border p-3.5 text-xs leading-relaxed font-semibold',
                          isUser
                            ? 'border-[#E5EAF0] bg-white text-[#14213D] shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                            : 'dark:bg-muted/40 border-slate-100 bg-[#FAF9F6] text-[#14213D] dark:border-slate-800/80 dark:text-white'
                        )}
                      >
                        <p className="break-words whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* 4. Security Card at bottom of transcript area */}
        <div className="mx-5 mb-3.5 flex shrink-0 items-center justify-between rounded-2xl border border-[#0FAF9F]/15 bg-[#E9F7F4]/40 px-4 py-3 text-left shadow-2xs select-none dark:bg-[#0FAF9F]/5">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#0FAF9F]/10 bg-[#E9F7F4] text-[#0FAF9F]">
              <ShieldCheck className="size-4.5" />
            </span>
            <div className="space-y-0.5">
              <h4 className="text-[11px] leading-tight font-bold text-[#0FAF9F]">
                Your Conversation is Secure
              </h4>
              <p className="text-[9px] leading-tight font-semibold text-[#64748B] dark:text-slate-400">
                We protect your privacy and health information with a secure conversation
                experience.
              </p>
            </div>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-[#0FAF9F]">
            <Lock className="size-3.5" />
          </div>
        </div>

        {/* 5. Voice Control Bottom Panel */}
        <div className="dark:bg-card/40 mx-5 mb-5 flex shrink-0 items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-[#FAF9F6] p-3 shadow-xs dark:border-slate-800">
          {/* Left: Microphone status */}
          <div className="flex items-center gap-2.5 text-left select-none">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full border bg-white transition-colors dark:bg-slate-900',
                isMicEnabled
                  ? 'border-slate-200 text-[#0FAF9F]'
                  : 'border-rose-250 bg-rose-50/50 text-rose-500'
              )}
            >
              {isMicEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </span>
            <div className="space-y-0.5">
              <h4 className="text-[10px] leading-tight font-bold text-[#14213D] sm:text-[11px] dark:text-white">
                {isMicEnabled ? 'Microphone Active' : 'Microphone Muted'}
              </h4>
              <p className="text-[9px] leading-none font-semibold text-[#64748B] dark:text-slate-400">
                {isMicEnabled ? 'Audio reactive' : 'Click Tap to Speak to unmute'}
              </p>
            </div>
          </div>

          {/* Center: Waveform animation */}
          <div className="flex h-8 flex-1 items-center justify-center overflow-hidden">
            <VoiceVisualizer uiState={uiState} volume={isMicEnabled ? volume : 0} barCount={22} />
          </div>

          {/* Right: Tap to Speak Button */}
          <button
            type="button"
            onClick={toggleMute}
            disabled={isEnded || isConnecting}
            className={cn(
              'inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold shadow-2xs transition-all select-none hover:scale-102 active:scale-98',
              isMicEnabled
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                : 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
            )}
          >
            {isMicEnabled ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
            <span>{isMicEnabled ? 'Mute' : 'Tap to Speak'}</span>
          </button>
        </div>
      </div>

      {/* Security note under card */}
      <p className="mt-2.5 mb-4 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#64748B] select-none sm:text-[11px] dark:text-slate-500">
        <Lock className="size-3 shrink-0 text-[#64748B]/80" />
        <span>Microphone audio is processed locally and securely.</span>
      </p>
    </div>
  );
}
