export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;
  tagline: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  endButtonText: string;
  talkAgainButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorDark?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;

  // agent dispatch configuration
  agentName?: string;

  // LiveKit Cloud Sandbox configuration
  sandboxId?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'SehatSaathi AI',
  pageTitle: 'SehatSaathi AI — Voice for Bharat',
  pageDescription:
    'SehatSaathi AI is a voice-first virtual clinic receptionist designed to make appointments, clinic information, and doctor messages easier through natural conversation.',
  tagline: 'Voice for Bharat Edition',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/sehatsaathi-mark.svg',
  accent: '#0F6E56',
  logoDark: '/sehatsaathi-mark.svg',
  accentDark: '#FF9933',
  startButtonText: 'Start Conversation',
  endButtonText: 'End Conversation',
  talkAgainButtonText: 'Start Again',

  audioVisualizerType: 'wave',
  audioVisualizerColor: '#0F6E56',
  audioVisualizerColorDark: '#FF9933',
  audioVisualizerRadialBarCount: 24,
  audioVisualizerRadialRadius: 100,

  // agent dispatch configuration
  agentName: process.env.AGENT_NAME ?? undefined,

  // LiveKit Cloud Sandbox configuration
  sandboxId: undefined,
};
