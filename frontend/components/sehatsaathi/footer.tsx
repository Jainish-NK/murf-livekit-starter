'use client';

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={`relative z-10 w-full py-6 px-4 text-center text-xs text-gray-text ${className}`}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 leading-relaxed">
        <span>© 2025 SehatSaathi AI</span>
        <span className="hidden sm:inline">·</span>
        <span>Voice for Bharat Edition</span>
        <span className="hidden sm:inline">·</span>
        <span className="text-green dark:text-green-light font-medium">AI Clinic Receptionist</span>
        <span className="hidden sm:inline">·</span>
        <span>Built with Murf Falcon TTS &amp; LiveKit Realtime Voice</span>
        <span className="inline-flex items-center gap-0.5 ml-1 select-none">
          <span className="size-2 rounded-full bg-saffron inline-block" />
          <span className="size-2 rounded-full bg-white border border-border inline-block" />
          <span className="size-2 rounded-full bg-green inline-block" />
        </span>
      </div>
    </footer>
  );
}
