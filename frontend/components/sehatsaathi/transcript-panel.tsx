'use client';

import { useEffect, useRef } from 'react';
import type { ReceivedMessage } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  MessageSquare,
  Clock3,
  PhoneOff,
  Mic,
  Activity,
  User,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { UIState } from '@/hooks/use-ui-state';
import { VoiceVisualizer } from '@/components/sehatsaathi/voice-visualizer';

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

  // Auto-scroll to bottom as new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Format seconds to mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format message timestamp
  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isSpeaking = uiState === 'speaking';
  const isListening = uiState === 'listening';
  const isConnecting = uiState === 'connecting';
  const isEnded = uiState === 'ended';

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-[480px] sm:min-h-[520px] rounded-3xl border border-border bg-surface dark:bg-card shadow-md backdrop-blur-md overflow-hidden transition-all',
        className
      )}
    >
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-5 py-3 bg-surface-soft/60 dark:bg-muted/20">
        {/* Left: Back chevron + speech bubble + "Live Conversation" */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg p-1 text-gray-text hover:bg-muted transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <MessageSquare className="size-4 text-green dark:text-green-light" />
          <h3 className="font-display text-sm font-bold text-navy-text dark:text-foreground">
            Live Conversation
          </h3>
        </div>

        {/* Right: Session Timer Pill + End / Restart Button */}
        <div className="flex items-center gap-2">
          {(isListening || isSpeaking) && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface dark:bg-card px-2.5 py-1 text-xs font-semibold text-gray-text shadow-2xs">
              <Clock3 className="size-3 text-gray-text" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
          )}

          {(isListening || isSpeaking || isConnecting) && onEndCall && (
            <button
              type="button"
              onClick={onEndCall}
              className="inline-flex items-center gap-1.5 rounded-full bg-danger-red hover:bg-red-700 text-white px-3 py-1 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <PhoneOff className="size-3" />
              <span>End Conversation</span>
            </button>
          )}

          {isEnded && onStartAgain && (
            <button
              type="button"
              onClick={onStartAgain}
              className="inline-flex items-center gap-1.5 rounded-full bg-green hover:bg-green/90 text-white px-3 py-1 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Start Again</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Live Status Block (Centered top of panel body) */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2 px-4 border-b border-border/50 bg-surface dark:bg-card text-center space-y-1.5">
        {/* Status Pill */}
        {isListening && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-mint dark:bg-emerald-950/60 border border-green/30 px-3 py-1 text-xs font-bold text-green dark:text-green-light">
            <Mic className="size-3.5" />
            <span>Listening to you</span>
          </div>
        )}
        {isSpeaking && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 border border-saffron/30 px-3 py-1 text-xs font-bold text-saffron">
            <Activity className="size-3.5 animate-pulse" />
            <span>Responding to you</span>
          </div>
        )}
        {isConnecting && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/30 px-3 py-1 text-xs font-bold text-brand-sky">
            <span>Connecting session...</span>
          </div>
        )}
        {isEnded && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3.5 py-1 text-xs font-bold text-gray-text">
            <span>Call ended — the conversation is over</span>
          </div>
        )}
        {uiState === 'ready' && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-mint border border-green/30 px-3 py-1 text-xs font-bold text-green dark:text-green-light">
            <span>Ready for your conversation</span>
          </div>
        )}

        {/* Subtext */}
        <p className="text-xs text-gray-text">
          {isListening
            ? "Go ahead, I'm listening."
            : isSpeaking
              ? "SehatSaathi is responding..."
              : isConnecting
                ? "Connecting to virtual receptionist..."
                : isEnded
                  ? "Thank you for talking with SehatSaathi AI. Click below to start again."
                  : "Click 'Start Conversation' to begin."}
        </p>

        {/* Live Waveform Visualization: Driven by real volume */}
        {!isEnded && (
          <div className="w-full max-w-[200px] h-7 flex items-center justify-center mt-1">
            <VoiceVisualizer uiState={uiState} volume={volume} barCount={16} />
          </div>
        )}

        {/* Start Again Action inside Ended banner */}
        {isEnded && onStartAgain && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onStartAgain}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron via-[#F59E0B] to-green text-white px-4 py-1.5 text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Start Again</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Transcript Feed (Scrollable message list) */}
      <div
        ref={scrollerRef}
        className="custom-scrollbar flex-1 space-y-3.5 overflow-y-auto px-4 py-4 max-h-[300px] sm:max-h-[360px]"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full py-12 text-center text-xs text-gray-text"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-surface-mint text-green mb-2">
                <Sparkles className="size-4 animate-pulse" />
              </div>
              <p className="font-semibold text-navy-text dark:text-foreground">
                No messages yet
              </p>
              <p className="text-[11px] mt-0.5 max-w-[200px]">
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
                  className="flex items-start gap-2.5 w-full text-left"
                >
                  {/* Small Circular Avatar */}
                  <div
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5',
                      isUser
                        ? 'bg-saffron/15 text-saffron border border-saffron/25'
                        : 'bg-green/15 text-green dark:text-green-light border border-green/25'
                    )}
                  >
                    {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  </div>

                  {/* Message Bubble + Header */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-navy-text dark:text-foreground">
                        {isUser ? 'You' : 'SehatSaathi AI'}
                      </span>
                      <span className="text-[10px] text-gray-text">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'rounded-2xl p-3 text-xs leading-relaxed border',
                        isUser
                          ? 'bg-surface dark:bg-card border-border text-foreground shadow-2xs'
                          : 'bg-[#F4F6F9] dark:bg-muted/40 border-border/80 text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* 4. Speaking Indicator Bar (Bottom of panel, visible when agent is speaking) */}
      {isSpeaking && (
        <div className="flex items-center justify-between border-t border-saffron/30 bg-saffron/10 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-saffron font-bold">
            <Mic className="size-3.5 animate-pulse text-saffron" />
            <span>SehatSaathi is speaking</span>
            <Activity className="size-3 text-saffron animate-pulse" />
          </div>
          <span className="text-[10px] text-gray-text font-semibold">
            AI Clinic Receptionist
          </span>
        </div>
      )}
    </div>
  );
}
