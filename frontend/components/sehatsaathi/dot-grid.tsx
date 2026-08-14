'use client';

import { cn } from '@/lib/shadcn/utils';

interface DotGridProps {
  className?: string;
  opacity?: number;
}

export function DotGrid({ className, opacity = 0.4 }: DotGridProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 h-full w-full select-none',
        className
      )}
      style={{ opacity }}
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle
              cx="2"
              cy="2"
              r="1.2"
              fill="currentColor"
              className="text-ss-navy/15 dark:text-white/10"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>
    </div>
  );
}
