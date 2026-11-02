import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, GitBranch, Users, Bookmark, Terminal, Menu, X, Sparkles, User } from 'lucide-react';
import { getGuestIdentity } from '../../services/guestIdentity';
import { api } from '../../services/api';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guest] = useState(getGuestIdentity());
  const [systemHealth, setSystemHealth] = useState({ online: true, mode: 'checking' });

  useEffect(() => {
    api.getHealth()
      .then(res => {
        setSystemHealth({
          online: res.status === 'healthy',
          mode: res.integrations?.groq?.mode || 'simulated',
          groqConfigured: res.integrations?.groq?.configured,
        });
      })
      .catch(() => {
        setSystemHealth({ online: false, mode: 'offline' });
      });
  }, []);

  const navLinks = [
    { label: 'Movies', path: '/movies', icon: Film },
    { label: 'What-If Creator', path: '/creator', icon: GitBranch },
    { label: 'Multiplayer Arena', path: '/lobby', icon: Users },
    { label: 'Saved Universes', path: '/saved', icon: Bookmark },
    { label: 'Dev Console', path: '/admin', icon: Terminal },
  ];

  const isActive = (path) => {
    if (path === '/movies' && location.pathname.startsWith('/movies')) return true;
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-20 bg-[#F2F1EE] border-b border-[rgba(49,35,49,0.12)]">
      <div className="page-container h-full flex items-center justify-between gap-4">
        
        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 sm:gap-3.5 group shrink-0 py-0.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#30152F] text-[#F2F1EE] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <span className="font-editorial text-lg sm:text-xl italic font-bold leading-none select-none">W</span>
          </div>
          <div className="flex flex-col justify-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#200F22] group-hover:text-[#30152F] transition-colors leading-none">
                WHAT IF
              </span>
              <span className="text-[9px] tracking-[0.2em] uppercase font-mono px-1.5 py-0.5 rounded bg-[#E8E6E2] text-[#654D63] border border-[rgba(49,35,49,0.12)] leading-none inline-flex items-center">
                RAG 2.0
              </span>
            </div>
            <p className="text-[10px] text-[#7E6C7D] tracking-[0.15em] uppercase hidden sm:block leading-none mt-1">
              The Alternate Movie Universe
            </p>
          </div>
        </Link>

        {/* Minimal Uppercase Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.1em] xl:tracking-[0.14em] uppercase transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                    : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F2F1EE]' : 'text-[#654D63]'}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Status & Guest Info */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] text-[10px] font-mono text-[#654D63]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemHealth.online ? 'bg-[#287A59] animate-pulse' : 'bg-[#A83842]'
              }`}
            />
            <span className="tracking-wider uppercase">
              {systemHealth.groqConfigured ? 'Groq Live' : 'RAG Active'}
            </span>
          </div>

          {/* Guest Identity Chip */}
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] hover:border-[#30152F]/40 transition-colors text-xs text-[#30152F]"
            title="Settings & Guest Profile"
          >
            <User className="w-3.5 h-3.5 text-[#654D63]" />
            <span className="font-medium truncate max-w-[100px] xl:max-w-[120px]">{guest.name.split(' ')[0]}</span>
          </Link>
        </div>

        {/* Mobile / Tablet Hamburger Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] text-[#30152F]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-[rgba(49,35,49,0.12)] bg-[#F2F1EE] px-4 pt-4 pb-6 space-y-2 animate-fadeIn shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors ${
                  active ? 'bg-[#30152F] text-[#F2F1EE]' : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[rgba(49,35,49,0.12)] flex items-center justify-between text-xs text-[#7E6C7D]">
            <span>Identity: {guest.name}</span>
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="text-[#30152F] font-semibold hover:underline">
              Settings →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
