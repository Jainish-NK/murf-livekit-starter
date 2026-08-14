'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronDown, Globe, Heart, HelpCircle, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { HelpModal } from '@/components/sehatsaathi/help-modal';
import { cn } from '@/lib/shadcn/utils';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type TranslationDictionary,
} from '@/lib/translations';

interface BrandHeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  className?: string;
  onNavClick?: (sectionId: string) => void;
}

export function BrandHeader({
  currentLang,
  onLanguageChange,
  t,
  className,
  onNavClick,
}: BrandHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for subtle shadow/border adjustments
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavClick) {
      onNavClick(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-[#E5EAF0] bg-white/95 px-4 backdrop-blur-md transition-all duration-300 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[#0B131B]/95',
          scrolled ? 'py-2 shadow-xs sm:py-2.5' : 'py-3 sm:py-4',
          className
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Left Brand Area */}
          <div className="flex items-center gap-2.5">
            {/* Logo Mark: Teal Heart inside circle */}
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div className="to-emerald-450 relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#0FAF9F] p-2 shadow-md shadow-[#0FAF9F]/20">
                <Heart className="size-5 fill-white text-white" />
              </div>

              {/* Title + Subtitle + Badge */}
              <div className="flex flex-col text-left">
                <div className="flex items-baseline leading-none">
                  <span className="font-display text-base font-black tracking-tight text-[#14213D] sm:text-lg dark:text-white">
                    Sehat<span className="text-[#0FAF9F]">Saathi</span>
                  </span>
                  <span className="font-display ml-1.5 rounded-md bg-[#0FAF9F] px-1.5 py-0.5 text-[9px] leading-none font-black text-white">
                    AI
                  </span>
                  <span className="ml-2 inline-flex origin-left scale-90 items-center rounded-full border border-[#0FAF9F]/30 bg-[#E9F7F4] px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[#0FAF9F] uppercase sm:scale-100 dark:bg-[#0FAF9F]/10">
                    VOICE FOR BHARAT
                  </span>
                </div>
                <span className="mt-1.5 text-[9px] leading-none font-semibold text-[#64748B] select-none dark:text-slate-400">
                  Your Health. Our Priority.
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links (Hidden on mobile) */}
          <nav className="dark:text-slate-355 hidden items-center gap-6 text-xs font-bold text-[#64748B] lg:flex">
            <button
              onClick={() => handleLinkClick('top')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              Home
            </button>
            <button
              onClick={() => handleLinkClick('features-section')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              Features
            </button>
            <button
              onClick={() => handleLinkClick('how-it-works-section')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              How It Works
            </button>
            <button
              onClick={() => handleLinkClick('promo-section')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              For Clinics
            </button>
            <button
              onClick={() => handleLinkClick('testimonials-section')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              Testimonials
            </button>
            <button
              onClick={() => handleLinkClick('faq-section')}
              className="cursor-pointer transition-colors hover:text-[#0FAF9F]"
            >
              FAQ
            </button>
          </nav>

          {/* Right Tools & CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* 1. Language selector pill with globe + active lang + chevron */}
            <div className="relative flex items-center">
              <label htmlFor="header-language-select" className="sr-only">
                Select Language
              </label>
              <div className="dark:bg-card flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all focus-within:ring-2 focus-within:ring-[#0FAF9F] hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200">
                <Globe className="size-3.5 shrink-0 text-[#0FAF9F]" aria-hidden />
                <select
                  id="header-language-select"
                  value={currentLang}
                  onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                  className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-bold text-slate-800 outline-none dark:text-slate-200"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-white py-1 text-slate-800 dark:bg-[#0B131B] dark:text-white"
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none size-3 shrink-0 text-slate-400" />
              </div>
            </div>

            {/* Dashboard Pill Button */}
            <Link
              href="/dashboard"
              className="dark:bg-card inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0FAF9F] dark:border-slate-800 dark:text-slate-200"
              aria-label="Analytics Dashboard"
            >
              <BarChart3 className="size-3.5 shrink-0 text-[#0FAF9F]" />
              <span>Dashboard</span>
            </Link>

            {/* Help Pill Button */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="dark:bg-card inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0FAF9F] dark:border-slate-800 dark:text-slate-200"
              aria-label="Help and guidance"
            >
              <HelpCircle className="size-3.5 text-[#64748B] dark:text-slate-400" />
              <span>Help</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle className="dark:bg-card rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs dark:border-slate-800" />
          </div>

          {/* Mobile Menu Actions (Hamburger toggle) */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle className="dark:bg-card scale-90 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-2xs dark:border-slate-800" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="dark:bg-card rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 absolute top-full right-0 left-0 space-y-4 border-b border-[#E5EAF0] bg-white px-4 py-5 shadow-lg duration-200 lg:hidden dark:border-slate-800 dark:bg-[#0B131B]">
            <nav className="text-slate-750 flex flex-col gap-3 text-sm font-bold dark:text-slate-200">
              <button
                onClick={() => handleLinkClick('top')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                Home
              </button>
              <button
                onClick={() => handleLinkClick('features-section')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                Features
              </button>
              <button
                onClick={() => handleLinkClick('how-it-works-section')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                How It Works
              </button>
              <button
                onClick={() => handleLinkClick('promo-section')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                For Clinics
              </button>
              <button
                onClick={() => handleLinkClick('testimonials-section')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                Testimonials
              </button>
              <button
                onClick={() => handleLinkClick('faq-section')}
                className="py-1 text-left transition-colors hover:text-[#0FAF9F]"
              >
                FAQ
              </button>
            </nav>

            <div className="flex flex-col gap-3 border-t border-[#E5EAF0] pt-4 dark:border-slate-800">
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Language
                </span>
                <div className="relative flex items-center">
                  <div className="dark:bg-card flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs dark:border-slate-800 dark:text-slate-200">
                    <Globe className="size-3.5 text-[#0FAF9F]" />
                    <select
                      value={currentLang}
                      onChange={(e) => {
                        onLanguageChange(e.target.value as SupportedLanguage);
                        setMobileMenuOpen(false);
                      }}
                      className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-bold text-slate-800 outline-none dark:text-slate-200"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option
                          key={lang.code}
                          value={lang.code}
                          className="bg-white dark:bg-[#0B131B]"
                        >
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Dashboard & Help Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="dark:bg-card flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                >
                  <BarChart3 className="size-3.5 text-[#0FAF9F]" />
                  <span>Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setHelpOpen(true);
                  }}
                  className="dark:bg-card flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                >
                  <HelpCircle className="size-3.5 text-[#64748B] dark:text-slate-400" />
                  <span>Help Center</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} t={t} />
    </>
  );
}
