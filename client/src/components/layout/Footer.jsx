import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Film, Shield, Terminal } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[rgba(49,35,49,0.12)] bg-[#E8E6E2] text-[#654D63] text-sm mt-auto relative">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Vision */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#30152F] text-[#F2F1EE] flex items-center justify-center">
                <span className="font-editorial text-base italic font-bold">W</span>
              </div>
              <span className="font-editorial text-xl font-bold text-[#200F22] tracking-tight">
                WHAT IF
              </span>
            </div>
            <p className="text-xs text-[#654D63] leading-relaxed">
              One Choice. Infinite Realities. An interactive cinematic narrative laboratory grounded in verified screenplay lore, vector search, and real-time multiplayer.
            </p>
            <div className="text-[10px] text-[#7E6C7D] font-mono tracking-wider uppercase">
              Curated for cinematic continuity & fair evaluation.
            </div>
          </div>

          {/* Column 2: Experiences */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[#200F22] uppercase tracking-[0.2em] font-mono">
              Experiences
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/creator" className="hover:text-[#200F22] transition-colors">
                  Alternate Timeline Simulator
                </Link>
              </li>
              <li>
                <Link to="/lobby?mode=mysteryMovie" className="hover:text-[#200F22] transition-colors">
                  Movie Guess (Mystery Mode)
                </Link>
              </li>
              <li>
                <Link to="/lobby?mode=coOpStory" className="hover:text-[#200F22] transition-colors">
                  Co-op Story Room
                </Link>
              </li>
              <li>
                <Link to="/lobby?mode=storyBattle" className="hover:text-[#200F22] transition-colors">
                  Story Battle (AI Judged)
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-[#200F22] transition-colors">
                  Saved Universes Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Cinema Universes */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[#200F22] uppercase tracking-[0.2em] font-mono">
              Featured Universes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/movies/vikram-2022" className="hover:text-[#200F22] transition-colors">
                  Vikram (Tamil • LCU)
                </Link>
              </li>
              <li>
                <Link to="/movies/baahubali-2015" className="hover:text-[#200F22] transition-colors">
                  Baahubali: The Beginning
                </Link>
              </li>
              <li>
                <Link to="/movies/nayakan-1987" className="hover:text-[#200F22] transition-colors">
                  Nayakan (Mani Ratnam)
                </Link>
              </li>
              <li>
                <Link to="/movies/kaithi-2019" className="hover:text-[#200F22] transition-colors">
                  Kaithi (Lokesh Kanagaraj)
                </Link>
              </li>
              <li>
                <Link to="/movies/the-dark-knight-2008" className="hover:text-[#200F22] transition-colors">
                  The Dark Knight (Nolan)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Architecture & Admin */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[#200F22] uppercase tracking-[0.2em] font-mono">
              Architecture
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#654D63]">
                <Shield className="w-3.5 h-3.5 text-[#287A59]" />
                <span>RAG Canon Grounding</span>
              </div>
              <div className="flex items-center gap-2 text-[#654D63]">
                <Film className="w-3.5 h-3.5 text-[#986421]" />
                <span>128-Dim Vector Space</span>
              </div>
              <div className="flex items-center gap-2 text-[#654D63]">
                <Terminal className="w-3.5 h-3.5 text-[#3C6E9E]" />
                <Link to="/admin" className="hover:text-[#3C6E9E] transition-colors">
                  Dev Diagnostic Console →
                </Link>
              </div>
            </div>
            <p className="text-[11px] text-[#7E6C7D] pt-2 border-t border-[rgba(49,35,49,0.12)]">
              Plot details and characters are sourced for non-commercial educational and interactive narrative analysis.
            </p>
          </div>

        </div>

        <div className="pt-12 mt-12 border-t border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7E6C7D]">
          <div>
            © {new Date().getFullYear()} WHAT IF. All rights reserved.
          </div>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <span>Powered by Groq Llama 3.3 + MongoDB Atlas</span>
            <Link to="/settings" className="hover:text-[#200F22] transition-colors">Preferences</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
