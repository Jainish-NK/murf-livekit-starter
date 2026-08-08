'use client';

import { useCallback, useState } from 'react';

export type MicPermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'no-device' | 'error';

export type MicPermissionResult =
  | { ok: true }
  | { ok: false; status: Exclude<MicPermissionStatus, 'idle' | 'requesting' | 'granted'> };

/**
 * Explicitly request microphone access before connecting to a LiveKit room.
 * Stops the temporary stream immediately after the permission check.
 */
export function useMicPermission() {
  const [status, setStatus] = useState<MicPermissionStatus>('idle');

  const reset = useCallback(() => {
    setStatus('idle');
  }, []);

  const request = useCallback(async (): Promise<MicPermissionResult> => {
    setStatus('requesting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      return { ok: false, status: 'error' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setStatus('granted');
      return { ok: true };
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('denied');
        return { ok: false, status: 'denied' };
      }

      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('no-device');
        return { ok: false, status: 'no-device' };
      }

      setStatus('error');
      return { ok: false, status: 'error' };
    }
  }, []);

  return { status, request, reset };
}
