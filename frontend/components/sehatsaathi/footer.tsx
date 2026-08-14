'use client';

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={`text-gray-text relative z-10 w-full px-4 py-6 text-center text-xs ${className}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-1.5 leading-relaxed sm:flex-row">
        <span>© 2025 SehatSaathi AI</span>
        <span className="hidden sm:inline">·</span>
        <span>Voice for Bharat Edition</span>
        <span className="hidden sm:inline">·</span>
        <span className="text-green dark:text-green-light font-medium">AI Clinic Receptionist</span>
        <span className="hidden sm:inline">·</span>
        <span>Built with Murf Falcon TTS &amp; LiveKit Realtime Voice</span>
        <span className="ml-1 inline-flex items-center gap-0.5 select-none">
          <span className="bg-saffron inline-block size-2 rounded-full" />
          <span className="border-border inline-block size-2 rounded-full border bg-white" />
          <span className="bg-green inline-block size-2 rounded-full" />
        </span>
      </div>
    </footer>
  );
}
