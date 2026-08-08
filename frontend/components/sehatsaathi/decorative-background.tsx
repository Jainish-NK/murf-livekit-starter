'use client';

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { DotGrid } from '@/components/sehatsaathi/dot-grid';

export function DecorativeBackground() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Structural Dot Grid for 3D depth */}
      <DotGrid opacity={0.25} />

      {/* 2. Centered Ambient 3D Glowing Radial Backlight */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[650px] h-[650px] rounded-full blur-[130px] transition-all duration-1000 z-0 bg-gradient-to-tr from-green/18 via-saffron/14 to-transparent"
      />

      {/* 3. Top-Left Flowing Tricolor Ribbon Graphic */}
      <svg
        className="absolute -top-12 -left-12 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] opacity-45 dark:opacity-25"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="saffron-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9933" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#FFAA4D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="green-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#138808" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ECFDF5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="white-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft Saffron Wave Ribbon */}
        <path
          d="M-50 180 C80 140, 160 260, 320 180 C400 140, 460 200, 520 160 L520 -50 L-50 -50 Z"
          fill="url(#saffron-ribbon)"
        />
        {/* Soft White Center Wave */}
        <path
          d="M-50 230 C90 190, 190 310, 350 230 C420 190, 480 250, 540 210 L540 -50 L-50 -50 Z"
          fill="url(#white-ribbon)"
          opacity="0.65"
        />
        {/* Soft Green Wave Ribbon */}
        <path
          d="M-50 280 C100 240, 210 360, 380 270 C440 230, 490 290, 550 250 L550 -50 L-50 -50 Z"
          fill="url(#green-ribbon)"
        />
      </svg>

      {/* 4. Left Ashoka Chakra Watermark (Behind Hero Heading) */}
      <svg
        className={`absolute top-[16%] -left-16 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] text-navy-text/5 dark:text-white/5 ${
          !reducedMotion ? 'ss-animate-spin-3d' : ''
        }`}
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        style={{ animationDuration: '24s' }}
      >
        <circle cx="100" cy="100" r="92" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="84" strokeDasharray="3 3" />
        <circle cx="100" cy="100" r="16" />
        <circle cx="100" cy="100" r="5" fill="currentColor" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + Math.cos(rad) * 16;
          const y1 = 100 + Math.sin(rad) * 16;
          const x2 = 100 + Math.cos(rad) * 84;
          const y2 = 100 + Math.sin(rad) * 84;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
        })}
      </svg>

      {/* 5. Right Ashoka Chakra Watermark (Behind Transcript Panel, bleeding off right edge) */}
      <svg
        className={`absolute top-[26%] -right-24 w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] text-navy-text/4 dark:text-white/4 ${
          !reducedMotion ? 'ss-animate-spin-3d' : ''
        }`}
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        style={{ animationDirection: 'reverse', animationDuration: '32s' }}
      >
        <circle cx="100" cy="100" r="92" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="84" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="18" />
        <circle cx="100" cy="100" r="6" fill="currentColor" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + Math.cos(rad) * 18;
          const y1 = 100 + Math.sin(rad) * 18;
          const x2 = 100 + Math.cos(rad) * 84;
          const y2 = 100 + Math.sin(rad) * 84;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
        })}
      </svg>

      {/* 6. Bottom Monument Skyline Silhouette (India Gate / Taj Mahal) */}
      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-18 dark:opacity-10 flex items-end">
        <svg
          className="w-full h-24 text-navy-text dark:text-white"
          viewBox="0 0 1200 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <rect x="0" y="115" width="1200" height="5" />

          {/* India Gate Silhouette Motif */}
          <g transform="translate(180, 20)">
            <rect x="0" y="40" width="14" height="55" />
            <rect x="56" y="40" width="14" height="55" />
            <path d="M14 55 Q35 30 56 55 L56 40 L14 40 Z" />
            <rect x="-6" y="30" width="82" height="10" />
            <rect x="4" y="20" width="62" height="10" />
            <rect x="14" y="12" width="42" height="8" />
            <polygon points="35,0 25,12 45,12" />
          </g>

          {/* Taj Mahal Silhouette Motif */}
          <g transform="translate(750, 15)">
            <path d="M50 45 C40 25, 45 10, 60 5 C75 10, 80 25, 70 45 Z" />
            <line x1="60" y1="5" x2="60" y2="0" stroke="currentColor" strokeWidth="2" />
            <rect x="35" y="45" width="50" height="50" />
            <path d="M48 95 L48 65 Q60 52 72 65 L72 95 Z" fill="var(--surface-soft)" />
            <path d="M22 55 C18 45, 20 35, 28 32 C36 35, 38 45, 34 55 Z" />
            <path d="M86 55 C82 45, 84 35, 92 32 C100 35, 102 45, 98 55 Z" />
            <rect x="0" y="20" width="6" height="75" />
            <polygon points="3,10 0,20 6,20" />
            <rect x="114" y="20" width="6" height="75" />
            <polygon points="117,10 114,20 120,20" />
          </g>

          {/* Distant Architecture Silhouettes */}
          <g transform="translate(480, 50)">
            <path d="M20 45 C15 30, 25 15, 35 12 C45 15, 55 30, 50 45 Z" />
            <rect x="20" y="45" width="30" height="20" />
          </g>
          <g transform="translate(1000, 45)">
            <rect x="10" y="30" width="10" height="40" />
            <rect x="35" y="25" width="12" height="45" />
            <rect x="60" y="35" width="10" height="35" />
          </g>
        </svg>
      </div>

      {/* 7. Soft Green Wave in Bottom-Right Corner */}
      <svg
        className="absolute -bottom-8 -right-8 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] opacity-40 dark:opacity-20"
        viewBox="0 0 400 400"
        fill="none"
      >
        <defs>
          <linearGradient id="br-green-grad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#138808" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ECFDF5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M400 120 C300 160, 220 260, 120 290 C60 310, 20 370, 0 400 L400 400 Z"
          fill="url(#br-green-grad)"
        />
        <path
          d="M400 200 C320 230, 260 300, 180 340 C140 360, 100 390, 80 400 L400 400 Z"
          fill="#138808"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}
