import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Users, Sparkles, ShieldCheck, Scale } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div 
      className="w-full h-full flex-1 flex flex-col justify-between relative isolate overflow-hidden bg-[#F2F1EE] text-[#30152F]"
      style={{ overscrollBehavior: 'none' }}
    >
      
      {/* Full-Bleed Cinematic Background Image Layer */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
        <img
          src="/cinematic_multiverse_hero.jpg"
          alt="Cinematic multiverse protagonist diverging into parallel alternate realities"
          className="w-full h-full object-cover object-[75%_center] sm:object-[80%_center] md:object-[82%_center] lg:object-[85%_center] filter contrast-[1.06] brightness-[0.98]"
        />
      </div>

      {/* Layered Pearl-Silver Readability Overlays */}
      {/* 1. Left-to-right gradient: Softens left negative space for typography while keeping right silhouettes atmospheric */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-[#F2F1EE] via-[#F2F1EE]/90 via-50% to-transparent sm:via-[#F2F1EE]/85 sm:via-48% lg:via-[#F2F1EE]/80 lg:via-50% lg:to-transparent" 
      />
      
      {/* 2. Narrow screen readability wash */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none bg-[#F2F1EE]/50 sm:bg-transparent" 
      />

      {/* 3. Subtle deep aubergine cinematic multiply tint */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none bg-[rgba(48,21,47,0.04)] mix-blend-multiply" 
      />

      {/* 4. Bottom edge blend */}
      <div 
        className="absolute inset-x-0 bottom-0 h-24 z-[1] pointer-events-none bg-gradient-to-t from-[#F2F1EE]/80 to-transparent" 
      />

      {/* Subtle Vertical Grid Lines Overlay (Full-Width) */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none opacity-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(to right, rgba(49, 35, 49, 0.07) 0px, rgba(49, 35, 49, 0.07) 1px, transparent 1px, transparent 140px)',
        }}
      />

      {/* Hero Content Container (Constrained width for typography & alignment) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex-1 flex flex-col justify-between py-3 sm:py-4 lg:py-5 xl:py-6 relative z-10">
        
        {/* Top Editorial Metadata Banner Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono uppercase tracking-[0.22em] text-[#654D63] pb-2.5 sm:pb-3 border-b border-[rgba(49,35,49,0.12)]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30152F]" />
            VOL. XXIV • ALTERNATE UNIVERSES
          </span>
          <span className="hidden sm:inline text-[#7E6C7D]">
            CANON / POSSIBILITY
          </span>
          <span className="text-[#30152F] font-semibold">
            EVERY CHOICE CHANGES THE STORY
          </span>
        </div>

        {/* Left-Aligned Editorial Hero Content (Positioned over the image's empty left area) */}
        <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl py-1 sm:py-2 my-auto">
          
          {/* Small Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#E8E6E2]/90 backdrop-blur-md border border-[rgba(49,35,49,0.15)] text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#30152F] mb-2.5 sm:mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#30152F]" />
            <span>SCREENPLAY CONTINUITY SIMULATOR</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.75rem] font-bold leading-[0.94] tracking-tight text-[#200F22] mb-2.5 sm:mb-3 drop-shadow-sm">
            ONE CHOICE.<br />
            <span className="italic font-normal text-[#30152F]">INFINITE REALITIES.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base md:text-lg text-[#654D63] font-normal leading-relaxed mb-4 sm:mb-5 max-w-lg">
            What if one moment changed everything? Explore the stories that could have existed.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md mb-4 sm:mb-5">
            <Link to="/creator" className="flex-1 sm:flex-initial">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-xs uppercase tracking-[0.18em] px-7 py-3.5 shadow-lg shadow-[#30152F]/10 hover:shadow-xl"
                icon={GitBranch}
              >
                EXPLORE WHAT IF
              </Button>
            </Link>

            <Link to="/lobby" className="flex-1 sm:flex-initial">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-xs uppercase tracking-[0.18em] px-6 py-3.5 bg-[#E8E6E2]/90 backdrop-blur-md"
                icon={Users}
              >
                PLAY WITH A FRIEND
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] text-[#7E6C7D] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#287A59]" />
              VERIFIED SCREENPLAYS
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#986421]" />
              BRANCHING CANON
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#3C6E9E]" />
              AI GRAND JUDGED
            </span>
          </div>

        </div>

        {/* Bottom Floating Status Strip (Desktop) */}
        <div className="hidden lg:flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase text-[#7E6C7D] pt-3 sm:pt-4 border-t border-[rgba(49,35,49,0.08)]">
          <span>PARALLEL REALITIES • 12+ SCREENPLAY UNIVERSES</span>
          <span className="flex items-center gap-2 text-[#30152F] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#287A59] animate-pulse" />
            GROUND-TRUTH RAG ACTIVE
          </span>
        </div>

      </div>

    </div>
  );
};
