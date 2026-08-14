'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Building,
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Mic,
  PhoneCall,
  ShieldCheck,
  Star,
  Twitter,
  Users,
  Youtube,
} from 'lucide-react';
import { ConnectionBanner, MicBanner } from '@/components/sehatsaathi/banners';
import { BrandHeader } from '@/components/sehatsaathi/brand-header';
import { HelpModal } from '@/components/sehatsaathi/help-modal';
import type { MicPermissionStatus } from '@/hooks/use-mic-permission';
import { type SupportedLanguage, type TranslationDictionary } from '@/lib/translations';

interface PremiumLandingProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  onStartCall: () => void;
  isStartingCall?: boolean;
  micStatus: MicPermissionStatus;
  bannerVariant: 'reconnecting' | 'error' | 'timeout' | null;
  onRetryMic: () => void;
}

export function PremiumLanding({
  currentLang,
  onLanguageChange,
  t,
  onStartCall,
  isStartingCall = false,
  micStatus,
  bannerVariant,
  onRetryMic,
}: PremiumLandingProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      id="top"
      className="relative flex min-h-screen w-full flex-col bg-[#FFFFFF] font-sans text-[#14213D] transition-colors duration-300 dark:bg-[#0B131B] dark:text-slate-100"
    >
      {/* Soft light-teal blurred glow behind hero visual */}
      <div className="pointer-events-none absolute top-[5%] right-[5%] z-0 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#E9F7F4] to-transparent opacity-60 blur-[80px] dark:opacity-[0.05]" />

      {/* 1. Header (Redesigned Unified Navbar Component) */}
      <BrandHeader
        currentLang={currentLang}
        onLanguageChange={onLanguageChange}
        t={t}
        onNavClick={scrollToSection}
      />

      {/* 2. Main Page Content */}
      <main className="relative z-10 flex w-full flex-1 flex-col justify-start">
        {/* Dynamic Banners for permission/connection errors */}
        {(micStatus === 'denied' ||
          micStatus === 'no-device' ||
          micStatus === 'error' ||
          bannerVariant) && (
          <div className="animate-in fade-in slide-in-from-top-4 relative z-30 mx-auto mt-6 w-full max-w-lg space-y-4 px-6 duration-300">
            <MicBanner status={micStatus} t={t} onRetry={onRetryMic} />
            <ConnectionBanner variant={bannerVariant} t={t} onRetry={onRetryMic} />
          </div>
        )}

        {/* HERO SECTION */}
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-20">
          {/* Left Column Hero Copy */}
          <div className="flex flex-col space-y-6 text-left lg:col-span-7 lg:pr-6">
            {/* AI Assistant Badge */}
            <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-[11px] font-bold tracking-wide text-[#0FAF9F] uppercase select-none dark:bg-[#0FAF9F]/10">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#0FAF9F]" />
              <span>AI HEALTH ASSISTANT</span>
            </div>

            {/* Premium Heading */}
            <h1 className="font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-[#14213D] sm:text-5xl lg:text-[56px] dark:text-white">
              Your Clinic.
              <br />
              Your Voice.
              <br />
              <span className="bg-gradient-to-r from-[#0FAF9F] to-[#0d9688] bg-clip-text text-transparent">
                Your Saathi.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="dark:text-slate-350 max-w-[540px] text-sm leading-relaxed font-medium text-[#64748B] sm:text-base">
              Talk naturally with SehatSaathi AI for instant health support, medication reminders,
              appointments and more.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartCall}
                disabled={isStartingCall}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0FAF9F] px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#0d9688] active:scale-[0.98] sm:min-h-12 sm:px-8"
              >
                {isStartingCall ? (
                  <span className="size-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Mic className="size-4.5" />
                )}
                <span>Talk to SehatSaathi AI</span>
              </button>

              <button
                onClick={() => scrollToSection('features-section')}
                className="dark:bg-card inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 shadow-2xs transition-all hover:scale-[1.02] hover:bg-slate-50 sm:min-h-12 sm:px-8 dark:border-slate-800 dark:text-slate-200"
              >
                <span>Explore Features</span>
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Subtle disclaimer */}
            <div className="dark:text-slate-450 flex items-center gap-2 pt-2 text-[10px] font-semibold text-[#64748B] select-none sm:text-xs">
              <Lock className="size-3.5 shrink-0 text-[#0FAF9F]" />
              <span>100% Secure &amp; Privacy-Focused</span>
            </div>
          </div>

          {/* Right Column Hero Graphic */}
          <div className="relative flex items-center justify-center select-none lg:col-span-5">
            {/* Back glow */}
            <div className="absolute -z-10 size-80 animate-pulse rounded-full bg-[#0FAF9F]/10 blur-[60px] dark:bg-[#0FAF9F]/5" />

            {/* Soft Healthcare AI Circular Container */}
            <div className="animate-breathe-visual relative flex size-[300px] items-center justify-center rounded-full border border-[#0FAF9F]/20 bg-gradient-to-br from-white to-[#FAF9F6] p-2 shadow-xl sm:size-[360px] dark:from-[#131F2B] dark:to-[#0B131B]">
              {/* Spinning tech orbits */}
              <div className="ss-animate-spin-3d absolute inset-0 rounded-full border border-dashed border-[#0FAF9F]/30" />
              <div className="absolute inset-4 rounded-full border border-[#E9F7F4] dark:border-slate-800/80" />

              {/* Outer floating visual cards */}
              <div className="animate-float-1 absolute -top-3 -right-2 z-20 flex items-center gap-2.5 rounded-2xl border border-[#E5EAF0] bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-[#131F2B]">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                  <Activity className="size-4.5" />
                </span>
                <div className="text-left">
                  <div className="text-[10px] leading-tight font-extrabold text-[#14213D] dark:text-white">
                    Live Vitals
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600">Receptionist Active</span>
                </div>
              </div>

              <div className="animate-float-2 absolute -bottom-4 -left-4 z-20 flex items-center gap-2.5 rounded-2xl border border-[#E5EAF0] bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-[#131F2B]">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                  <Globe className="size-4.5" />
                </span>
                <div className="text-left">
                  <div className="text-[10px] leading-tight font-extrabold text-[#14213D] dark:text-white">
                    Bharat Multilingual
                  </div>
                  <span className="text-[9px] font-bold text-[#64748B] dark:text-slate-400">
                    Hindi · Eng · Guj
                  </span>
                </div>
              </div>

              {/* Front-Facing Robot Graphic */}
              <div className="dark:bg-card relative z-10 flex size-[240px] items-center justify-center overflow-hidden rounded-full border border-[#E5EAF0] bg-white p-1 shadow-lg sm:size-[290px] dark:border-slate-800">
                <img
                  src="/Hero_Robo_image.png"
                  alt="SehatSaathi AI Assistant Robot"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features-section"
          className="mx-auto w-full max-w-7xl scroll-mt-10 space-y-12 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="space-y-3">
            <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
              FEATURES
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
              AI-Powered Patient Solutions
            </h2>
            <p className="mx-auto max-w-xl text-sm font-medium text-[#64748B] dark:text-slate-400">
              Explore how SehatSaathi AI automates clinic workflow while providing an accessible
              voice platform for patients.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: AI Voice Consultation */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Mic className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                AI Voice Consultation
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Talk naturally in Hindi, English or Gujarati and get instant clinic coordinate
                responses and general guidance.
              </p>
            </div>

            {/* Card 2: Medication Reminders */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Clock className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                Medication Reminders
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Never miss a dose. Automated, patient-focused scheduling coordinates reminders
                directly through natural voice.
              </p>
            </div>

            {/* Card 3: Appointment Assistance */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Calendar className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                Appointment Assistance
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Request, reschedule or check appointments easily. SehatSaathi notes and files all
                request details instantly.
              </p>
            </div>

            {/* Card 4: Health Guidance */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Heart className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                Health Guidance
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Get accurate, clear guidance regarding clinic services, health FAQs, and basic
                wellness parameters.
              </p>
            </div>

            {/* Card 5: Human Specialist Escalation */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Users className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                Human Specialist Escalation
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Integrated escalation protocols seamlessly hand over complex medical queries or
                emergency contexts to human doctors.
              </p>
            </div>

            {/* Card 6: Multilingual Support */}
            <div className="group rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left shadow-2xs transition-all duration-300 hover:scale-[1.02] hover:border-[#0FAF9F]/30 hover:shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F] transition-transform duration-300 group-hover:scale-110 dark:bg-[#0FAF9F]/10">
                <Globe className="size-5.5 text-[#0FAF9F]" />
              </div>
              <h3 className="mb-2 text-base font-extrabold text-[#14213D] dark:text-white">
                Multilingual Support
              </h3>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Speaks Hindi, English, and Gujarati fluently, including natural hybrid mixtures of
                language spoken across India.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works-section"
          className="dark:border-slate-850 w-full scroll-mt-10 border-y border-[#E5EAF0] bg-[#FAF9F6] py-16 sm:py-24 dark:bg-[#131F2B]/30"
        >
          <div className="mx-auto max-w-7xl space-y-12 px-4 text-center sm:px-6 lg:px-8">
            <div className="space-y-3">
              <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
                WORKFLOW
              </span>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
                How SehatSaathi Works
              </h2>
              <p className="mx-auto max-w-xl text-sm font-medium text-[#64748B] dark:text-slate-400">
                Talk naturally. Get things done. Our streamlined voice coordination functions in
                three simple steps.
              </p>
            </div>

            <div className="relative mx-auto max-w-4xl pt-6">
              {/* Timeline center line */}
              <div className="absolute top-[48px] right-[10%] left-[10%] hidden h-[2px] bg-slate-200 md:block dark:bg-slate-800" />

              <div className="relative z-10 grid grid-cols-1 gap-10 md:grid-cols-3">
                {/* Step 1 */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="font-display flex size-16 items-center justify-center rounded-full border-4 border-[#E9F7F4] bg-white text-lg font-black text-[#0FAF9F] shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
                    01
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                      Speak
                    </h4>
                    <p className="mx-auto max-w-[220px] text-xs font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                      Talk naturally with SehatSaathi AI via microphone in your native language.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="font-display flex size-16 items-center justify-center rounded-full border-4 border-[#E9F7F4] bg-white text-lg font-black text-[#0FAF9F] shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
                    02
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                      Understand
                    </h4>
                    <p className="mx-auto max-w-[220px] text-xs font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                      AI parses your spoken query, identifying health context, dates, and intent.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="font-display flex size-16 items-center justify-center rounded-full border-4 border-[#E9F7F4] bg-white text-lg font-black text-[#0FAF9F] shadow-md dark:border-slate-800 dark:bg-[#131F2B]">
                    03
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                      Assist
                    </h4>
                    <p className="mx-auto max-w-[220px] text-xs font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                      Get instant guidance, log reminders, set appointments or escalate context to a
                      physician.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOR CLINICS */}
        <section
          id="promo-section"
          className="mx-auto grid w-full max-w-7xl scroll-mt-10 grid-cols-1 items-center gap-12 px-4 py-16 text-left sm:px-6 sm:py-24 lg:grid-cols-12 lg:px-8"
        >
          {/* Left Column visual mock */}
          <div className="relative flex items-center justify-center select-none lg:col-span-5">
            <div className="absolute -z-10 size-72 rounded-full bg-[#0FAF9F]/10 blur-[50px]" />
            <div className="w-full max-w-[420px] space-y-5 rounded-3xl border border-[#E5EAF0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#131F2B]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl border border-[#0FAF9F]/10 bg-[#E9F7F4] text-[#0FAF9F]">
                  <Building className="size-5" />
                </span>
                <div>
                  <h4 className="text-sm leading-tight font-extrabold text-[#14213D] dark:text-white">
                    Clinic Panel
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600">Online Receiver</span>
                </div>
              </div>

              {/* Mini list check */}
              <div className="dark:text-slate-350 space-y-3 pt-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0FAF9F]">✓</span>
                  <span>AI Receptionist answering patient calls</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0FAF9F]">✓</span>
                  <span>Automated Medication reminder alerts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0FAF9F]">✓</span>
                  <span>Appointment scheduling &amp; verification</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0FAF9F]">✓</span>
                  <span>Call logs &amp; Analytics database</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onStartCall}
                  className="min-h-10 w-full cursor-pointer rounded-xl border border-[#0FAF9F]/15 bg-[#E9F7F4] text-center text-xs font-bold text-[#0FAF9F] transition-all hover:bg-[#0FAF9F]/15"
                >
                  Test Clinic Assistant Voice
                </button>
              </div>
            </div>
          </div>

          {/* Right Column copy */}
          <div className="flex flex-col space-y-6 lg:col-span-7">
            <span className="self-start rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
              FOR CLINICS
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
              Smarter Clinic Operations with AI Receptionists
            </h2>
            <p className="dark:text-slate-350 text-sm leading-relaxed font-semibold text-[#64748B] sm:text-base">
              SehatSaathi AI empowers healthcare facilities to manage patient intake and outbound
              coordination effortlessly. By automating calls, routing patient logs, and assisting
              with appointment requests in Hindi, English, and Gujarati, your clinic runs at peak
              efficiency.
            </p>

            <div className="grid grid-cols-1 gap-4.5 pt-2 text-xs font-bold text-[#14213D] sm:grid-cols-2 dark:text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-7.5 items-center justify-center rounded-lg bg-[#E9F7F4] text-[#0FAF9F]">
                  ✓
                </span>
                <span>Outbound Medication Alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-7.5 items-center justify-center rounded-lg bg-[#E9F7F4] text-[#0FAF9F]">
                  ✓
                </span>
                <span>Automatic Appointment Log</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-7.5 items-center justify-center rounded-lg bg-[#E9F7F4] text-[#0FAF9F]">
                  ✓
                </span>
                <span>Realtime Call Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-7.5 items-center justify-center rounded-lg bg-[#E9F7F4] text-[#0FAF9F]">
                  ✓
                </span>
                <span>Human Doctor Handover</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setHelpOpen(true)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0FAF9F] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.02] hover:bg-[#0d9688] active:scale-98"
              >
                <span>Explore Clinic Solutions</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {/* TRUST & SAFETY SECTION */}
        <section className="mx-auto w-full max-w-7xl space-y-12 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <div className="space-y-3">
            <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
              TRUST &amp; SAFETY
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
              Safe, Secure &amp; Professional
            </h2>
            <p className="mx-auto max-w-xl text-sm font-medium text-[#64748B] dark:text-slate-400">
              We design with safety first. SehatSaathi acts strictly as a clinic coordination
              utility, preserving boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="space-y-3 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-[#131F2B]">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                <ShieldCheck className="size-5" />
              </span>
              <h4 className="text-sm font-extrabold text-[#14213D] dark:text-white">
                Secure Conversations
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] dark:text-slate-400">
                Voice audio sessions are secure and encrypted. We enforce strict data handling to
                protect patient privacy.
              </p>
            </div>

            {/* Card 2 */}
            <div className="space-y-3 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-[#131F2B]">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                <Users className="size-5" />
              </span>
              <h4 className="text-sm font-extrabold text-[#14213D] dark:text-white">
                Human Escalation
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] dark:text-slate-400">
                Complex scenarios or medication advice trigger instant referral suggestions to a
                human doctor.
              </p>
            </div>

            {/* Card 3 */}
            <div className="space-y-3 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-[#131F2B]">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                <Activity className="size-5" />
              </span>
              <h4 className="text-sm font-extrabold text-[#14213D] dark:text-white">
                General Guidance
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] dark:text-slate-400">
                AI limits responses to clinic coordinates and general health FAQ without prescribing
                drugs.
              </p>
            </div>

            {/* Card 4 */}
            <div className="space-y-3 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-[#131F2B]">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E9F7F4] text-[#0FAF9F]">
                <Building className="size-5" />
              </span>
              <h4 className="text-sm font-extrabold text-[#14213D] dark:text-white">
                Verified Clinic Connection
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] dark:text-slate-400">
                All appointment requests and doctor callbacks require direct confirmation by clinic
                staff.
              </p>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section
          id="testimonials-section"
          className="mx-auto w-full max-w-7xl scroll-mt-10 space-y-12 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="space-y-3">
            <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
              TESTIMONIALS
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
              What Clinics &amp; Patients Say
            </h2>
            <p className="mx-auto max-w-xl text-sm font-medium text-[#64748B] dark:text-slate-400">
              Realistic feedback from patients and providers enjoying SehatSaathi&apos;s voice
              receptionist.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="dark:bg-card flex flex-col justify-between space-y-5 rounded-2xl border border-[#E5EAF0] bg-white p-6 shadow-2xs dark:border-slate-800">
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] italic sm:text-sm dark:text-slate-400">
                &quot;Our clinic reception desk is much more organized now. SehatSaathi logs patient
                calls and requests in the dashboard automatically in Hindi and Gujarati.&quot;
              </p>
              <div className="dark:border-slate-805 flex items-center gap-3.5 border-t border-slate-100 pt-4">
                <div className="border-slate-350 flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-slate-200 text-xs font-bold">
                  👩‍⚕️
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-[#14213D] dark:text-white">
                    Dr. Priya Sharma
                  </h4>
                  <span className="dark:text-slate-450 text-[10px] text-[#64748B]">
                    Sunrise Clinic, Ahmedabad
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="dark:bg-card flex flex-col justify-between space-y-5 rounded-2xl border border-[#E5EAF0] bg-white p-6 shadow-2xs dark:border-slate-800">
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] italic sm:text-sm dark:text-slate-400">
                &quot;Talking to the assistant is very natural. I asked for an appointment check in
                Hindi, and it recorded my details perfectly. Simple and very helpful.&quot;
              </p>
              <div className="dark:border-slate-808 flex items-center gap-3.5 border-t border-slate-100 pt-4">
                <div className="border-slate-350 flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-slate-200 text-xs font-bold">
                  👴
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-[#14213D] dark:text-white">Ramesh Patel</h4>
                  <span className="dark:text-slate-450 text-[10px] text-[#64748B]">
                    Patient, Gandhinagar
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="dark:bg-card flex flex-col justify-between space-y-5 rounded-2xl border border-[#E5EAF0] bg-white p-6 shadow-2xs dark:border-slate-800">
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] italic sm:text-sm dark:text-slate-400">
                &quot;I can ask health FAQs and confirm clinic operating hours anytime, day or
                night. Highly recommended for patients who prefer voice over typing!&quot;
              </p>
              <div className="flex items-center gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="border-slate-350 flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-slate-200 text-xs font-bold">
                  👩
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-[#14213D] dark:text-white">Meena Joshi</h4>
                  <span className="dark:text-slate-450 text-[10px] text-[#64748B]">
                    Patient, Vadodara
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section
          id="faq-section"
          className="mx-auto w-full max-w-4xl scroll-mt-10 space-y-8 px-4 py-16 text-left sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="space-y-3 text-center">
            <span className="rounded-full border border-[#0FAF9F]/20 bg-[#E9F7F4] px-3.5 py-1 text-xs font-bold tracking-widest text-[#0FAF9F] uppercase">
              FAQ
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                What is SehatSaathi AI?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                SehatSaathi AI is an interactive, voice-based AI healthcare assistant tailored for
                clinics and patients in Bharat. It helps with clinic navigation, medication logging,
                and appointment requests.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                How does voice conversation work?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                By allowing microphone access, users can speak directly into their browser.
                Real-time streaming voice interfaces parse, synthesize and play back interactive
                health reception dialogue instantly.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                Which languages are supported?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                SehatSaathi supports Hindi, English, and Gujarati. It also naturally parses Hinglish
                and mixed local dialects spoken across India.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                Can users reach a human doctor?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Yes. SehatSaathi will suggest escalating to a human specialist when a medical
                request is complex or falls outside basic administrative boundaries.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                Can clinics use SehatSaathi AI?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                Yes. Clinics use SehatSaathi to automate patient scheduling, handle call routing,
                trigger medication alerts, and collect analytic insights inside our clinic admin
                dashboard.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="dark:border-slate-850 dark:bg-card space-y-2 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-2xs">
              <h4 className="text-sm font-bold text-[#14213D] sm:text-base dark:text-white">
                Is SehatSaathi AI a replacement for doctors?
              </h4>
              <p className="text-xs leading-relaxed font-semibold text-[#64748B] sm:text-sm dark:text-slate-400">
                No. SehatSaathi AI does not diagnose, prescribe medications, or replace human
                doctors. It acts strictly as an administrative receptionist and patient information
                coordinate.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12 text-center select-none sm:px-6 sm:py-16 lg:px-8">
          <div className="relative space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0FAF9F] to-[#0d9688] p-8 text-white shadow-xl sm:p-12">
            {/* Tech line accents */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#FFFFFF_0%,transparent_50%)] opacity-10" />
            <div className="absolute -right-10 -bottom-10 size-40 rounded-full border-4 border-white/20" />

            <h3 className="font-display mx-auto max-w-xl text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              Your Health. Your Voice. Your Saathi.
            </h3>

            <p className="mx-auto max-w-[480px] text-xs font-medium text-slate-100/90 sm:text-sm">
              Start your voice session with SehatSaathi AI today and experience intelligent clinic
              receptionist assistance.
            </p>

            <div className="pt-2">
              <button
                onClick={onStartCall}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-2 text-sm font-bold text-[#0FAF9F] shadow-md transition-all hover:scale-[1.02] hover:bg-[#E9F7F4] active:scale-98 sm:min-h-12"
              >
                <Mic className="size-4.5 text-[#0FAF9F]" />
                <span>Start a Conversation</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <footer
        id="footer-section"
        className="relative z-10 mx-auto mt-12 w-full max-w-7xl rounded-t-3xl border-t border-[#E5EAF0] bg-white px-4 py-16 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[#131F2B]"
      >
        <div className="mb-12 grid w-full grid-cols-1 gap-8 text-left md:grid-cols-12">
          {/* Col 1: Logo & Info */}
          <div className="space-y-4 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full border border-[#0FAF9F]/10 bg-[#E9F7F4] p-1.5 shadow-2xs dark:bg-slate-800">
                <Heart className="size-4.5 fill-[#0FAF9F] text-[#0FAF9F]" />
              </div>
              <span className="font-display text-base font-bold text-[#14213D] dark:text-white">
                SehatSaathi AI
              </span>
            </div>
            <p className="max-w-[280px] text-xs leading-relaxed font-semibold text-[#64748B] dark:text-slate-400">
              SehatSaathi is an AI-powered voice assistant that helps you manage your health and
              stay connected with your clinic effortlessly.
            </p>
            {/* Social follow buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button className="flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-[#0FAF9F] hover:bg-[#E9F7F4] dark:border-slate-800 dark:hover:bg-slate-800">
                <Linkedin className="size-3.5" />
              </button>
              <button className="flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-[#0FAF9F] hover:bg-[#E9F7F4] dark:border-slate-800 dark:hover:bg-slate-800">
                <Twitter className="size-3.5" />
              </button>
              <button className="flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-[#0FAF9F] hover:bg-[#E9F7F4] dark:border-slate-800 dark:hover:bg-slate-800">
                <Instagram className="size-3.5" />
              </button>
              <button className="flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-[#0FAF9F] hover:bg-[#E9F7F4] dark:border-slate-800 dark:hover:bg-slate-800">
                <Youtube className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="text-xs font-bold tracking-wider text-[#14213D] uppercase dark:text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection('top')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('features-section')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works-section')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('promo-section')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  For Clinics
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('testimonials-section')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Testimonials
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('faq-section')}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="text-xs font-bold tracking-wider text-[#14213D] uppercase dark:text-white">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-[#0FAF9F]">
                  Blog
                </a>
              </li>
              <li>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Help Center
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-[#0FAF9F]">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0FAF9F]">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: For Clinics */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="text-xs font-bold tracking-wider text-[#14213D] uppercase dark:text-white">
              For Clinics
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400">
              <li>
                <Link href="/dashboard" className="hover:text-[#0FAF9F]">
                  Clinic Dashboard
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Manage Appts
                </button>
              </li>
              <li>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="cursor-pointer hover:text-[#0FAF9F]"
                >
                  Integrations
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact Info (Target Details) */}
          <div className="space-y-3.5 md:col-span-2">
            <h4 className="text-xs font-bold tracking-wider text-[#14213D] uppercase dark:text-white">
              Contact Us
            </h4>
            <div className="space-y-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-3.5 shrink-0 text-[#0FAF9F]" />
                <span>+91 9998983110</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-[#0FAF9F]" />
                <a href="mailto:khuntjainish48@gmail.com" className="hover:text-[#0FAF9F]">
                  khuntjainish48@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#0FAF9F]" />
                <span>Ahmedabad, Gujarat, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs font-semibold text-[#64748B] select-none sm:flex-row dark:border-slate-800/80 dark:text-slate-500">
          <span>© 2026 SehatSaathi AI. All rights reserved.</span>
          <span>Your Health. Our Priority.</span>
        </div>
      </footer>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} t={t} />
    </div>
  );
}
