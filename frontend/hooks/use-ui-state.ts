'use client';

import { useMemo } from 'react';
import { ConnectionState } from 'livekit-client';
import type { AgentState } from '@livekit/components-react';

export type UIState = 'ready' | 'connecting' | 'listening' | 'speaking' | 'ended';

export type StatusPillLabel =
  | 'Idle'
  | 'Connecting'
  | 'Listening'
  | 'Speaking'
  | 'Reconnecting'
  | 'Disconnected';

export interface DeriveUiStateInput {
  hasStarted: boolean;
  hasEnded: boolean;
  connectionState: ConnectionState;
  agentState: AgentState;
}

export function deriveUiState({
  hasStarted,
  hasEnded,
  connectionState,
  agentState,
}: DeriveUiStateInput): UIState {
  if (hasEnded || agentState === 'failed') {
    return 'ended';
  }

  if (!hasStarted) {
    return 'ready';
  }

  // Mid-call reconnect — keep an active call state rather than resetting to connecting
  if (
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting
  ) {
    return agentState === 'speaking' ? 'speaking' : 'listening';
  }

  if (
    connectionState === ConnectionState.Connecting ||
    agentState === 'connecting' ||
    agentState === 'initializing' ||
    agentState === 'pre-connect-buffering'
  ) {
    return 'connecting';
  }

  if (connectionState === ConnectionState.Disconnected && agentState === 'disconnected') {
    return 'connecting';
  }

  if (agentState === 'speaking') {
    return 'speaking';
  }

  // listening | thinking | idle
  return 'listening';
}

export function deriveStatusPill({
  hasStarted,
  hasEnded,
  connectionState,
  agentState,
  uiState,
}: DeriveUiStateInput & { uiState: UIState }): StatusPillLabel {
  if (
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting
  ) {
    return 'Reconnecting';
  }

  if (hasEnded || uiState === 'ended') {
    return hasStarted ? 'Disconnected' : 'Idle';
  }

  if (uiState === 'ready') return 'Idle';
  if (uiState === 'connecting') return 'Connecting';
  if (uiState === 'speaking' || agentState === 'speaking') return 'Speaking';
  if (uiState === 'listening') return 'Listening';

  return 'Idle';
}

export function useUiState(
  hasStarted: boolean,
  hasEnded: boolean,
  connectionState: ConnectionState,
  agentState: AgentState
) {
  const uiState = useMemo(
    () => deriveUiState({ hasStarted, hasEnded, connectionState, agentState }),
    [hasStarted, hasEnded, connectionState, agentState]
  );

  const statusPill = useMemo(
    () =>
      deriveStatusPill({
        hasStarted,
        hasEnded,
        connectionState,
        agentState,
        uiState,
      }),
    [hasStarted, hasEnded, connectionState, agentState, uiState]
  );

  return { uiState, statusPill };
}
