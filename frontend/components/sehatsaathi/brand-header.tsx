'use client';

import { useState } from 'react';
import { Globe, HelpCircle, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { HelpModal } from '@/components/sehatsaathi/help-modal';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type TranslationDictionary,
} from '@/lib/translations';
import { cn } from '@/lib/shadcn/utils';

interface BrandHeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  className?: string;
}

export function BrandHeader({
  currentLang,
  onLanguageChange,
  t,
  className,
}: BrandHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 sm:px-8 bg-surface/90 dark:bg-card/90 backdrop-blur-md border-b border-border/80 shadow-2xs transition-all z-40',
          className
        )}
      >
        {/* Left: Rounded-square logo mark (blended orange, white, green) + SehatSaathi AI + VOICE FOR BHARAT pill */}
        <div className="flex items-center gap-3">
          {/* Logo Mark: Blended Orange, White, Green */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface shadow-2xs border border-border/60 p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sehatsaathi-mark.svg"
              alt="SehatSaathi AI"
              className="size-full object-contain rounded-lg"
              width={32}
              height={32}
            />
          </div>

          {/* Title + Edition Pill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-navy-text dark:text-foreground">
                SehatSaathi
              </span>
              <span className="font-display text-base sm:text-lg font-normal text-green dark:text-green-light">
                AI
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center rounded-full border border-saffron/40 bg-saffron/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-saffron uppercase">
              VOICE FOR BHARAT
            </span>
          </div>
        </div>

        {/* Right: Language Selector Pill, Help Pill, Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Language selector pill with globe + active lang + chevron */}
          <div className="relative flex items-center">
            <label htmlFor="header-language-select" className="sr-only">
              Select Language
            </label>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface dark:bg-card px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted/60 focus-within:ring-2 focus-within:ring-green">
              <Globe className="size-3.5 text-green dark:text-green-light shrink-0" aria-hidden />
              <select
                id="header-language-select"
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer pr-1 appearance-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-popover text-popover-foreground py-1"
                  >
                    {lang.name} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 text-muted-foreground shrink-0 pointer-events-none" />
            </div>
          </div>

          {/* 2. Help Pill Button */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface dark:bg-card px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/60 transition-all focus-visible:ring-2 focus-visible:ring-green cursor-pointer"
            aria-label="Help and guidance"
          >
            <HelpCircle className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Help</span>
          </button>

          {/* 3. Light / Dark Mode Toggle */}
          <ThemeToggle className="rounded-full bg-surface dark:bg-card border border-border shadow-2xs px-2 sm:px-2.5 py-1 sm:py-1.5" />
        </div>
      </header>

      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} t={t} />
    </>
  );
}
