'use client';

import { AlertTriangle, MicOff, Lock, RefreshCw, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import type { MicPermissionStatus } from '@/hooks/use-mic-permission';
import type { TranslationDictionary } from '@/lib/translations';

interface MicBannerProps {
  status: MicPermissionStatus;
  t: TranslationDictionary;
  onRetry?: () => void;
  className?: string;
}

export function MicBanner({ status, t, onRetry, className }: MicBannerProps) {
  if (status !== 'denied' && status !== 'no-device' && status !== 'error') {
    return null;
  }

  const isDenied = status === 'denied';
  const isNoDevice = status === 'no-device';

  const title = isDenied
    ? 'Microphone Access Blocked'
    : isNoDevice
      ? 'Microphone Not Found'
      : 'Microphone Access Error';

  const message = isDenied
    ? 'Microphone access is blocked in your browser settings. SehatSaathi AI requires microphone access to hear your voice.'
    : isNoDevice
      ? 'No microphone was detected on your device. Please plug in a microphone or headset and try again.'
      : 'Unable to access your microphone. Please check system permissions and try again.';

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex w-full max-w-lg flex-col gap-3.5 rounded-3xl border border-destructive/40 bg-destructive/10 dark:bg-destructive/15 p-5 text-left shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/20 text-destructive">
          <MicOff className="size-5" />
        </span>
        <div className="flex-1">
          <h4 className="font-display text-base font-bold text-destructive leading-tight">
            {title}
          </h4>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-foreground/90">
            {message}
          </p>
        </div>
      </div>

      {isDenied && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface/90 dark:bg-card/90 p-4 border border-border/80 text-xs text-foreground/90">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Lock className="size-4 text-saffron shrink-0" />
            <span>How to enable your microphone:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1 text-[11px] sm:text-xs">
            <li>Click the <span className="font-semibold text-foreground">🔒 lock icon</span> in your browser address bar.</li>
            <li>Change the <span className="font-semibold text-foreground">Microphone</span> setting to <span className="font-semibold text-green dark:text-green-light">Allow</span>.</li>
            <li>Click the <span className="font-semibold text-foreground">"Try Again"</span> button below.</li>
          </ol>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-xs sm:text-sm font-bold text-destructive-foreground shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

interface ConnectionBannerProps {
  variant: 'reconnecting' | 'error' | 'timeout' | null;
  t: TranslationDictionary;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionBanner({ variant, t, onRetry, className }: ConnectionBannerProps) {
  if (!variant) return null;

  const isReconnecting = variant === 'reconnecting';
  const isTimeout = variant === 'timeout';

  const title = isReconnecting
    ? t.states.reconnecting.title
    : isTimeout
      ? t.errors.connectionTimeoutTitle
      : t.errors.connectionErrorTitle;

  const copy = isReconnecting
    ? t.states.reconnecting.message
    : isTimeout
      ? t.errors.connectionTimeoutMessage
      : t.errors.connectionErrorMessage;

  return (
    <div
      role={isReconnecting ? 'status' : 'alert'}
      className={cn(
        'mx-auto flex w-full max-w-lg flex-col gap-4 rounded-3xl border p-5 text-left shadow-lg backdrop-blur-md transition-all duration-300',
        isReconnecting
          ? 'border-amber-300/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
          : 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10 text-foreground',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl',
            isReconnecting
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-destructive/15 text-destructive'
          )}
        >
          {isReconnecting ? (
            <RefreshCw className="size-5 animate-spin" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
        </span>
        <div className="flex-1">
          <h4
            className={cn(
              'font-display text-base font-bold leading-tight',
              isReconnecting ? 'text-amber-700 dark:text-amber-400' : 'text-destructive'
            )}
          >
            {title}
          </h4>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground/90 sm:text-sm">
            {copy}
          </p>
        </div>
      </div>

      {!isReconnecting && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-green hover:bg-green/90 text-sm font-bold text-white shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-green cursor-pointer"
        >
          <RefreshCw className="size-4" />
          {t.errors.retryBtn}
        </button>
      )}
    </div>
  );
}
