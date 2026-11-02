import React, { useState, useEffect } from 'react';
import { User, Shield, Cpu, Database, Save, RotateCcw, Check, Sparkles, AlertCircle, Server } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getGuestIdentity, updateGuestName } from '../services/guestIdentity';
import { api } from '../services/api';

export const SettingsPage = () => {
  const [guest, setGuest] = useState(getGuestIdentity());
  const [nameInput, setNameInput] = useState(guest.name);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [systemHealth, setSystemHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(res => setSystemHealth(res))
      .catch(err => setSystemHealth({ status: 'degraded', error: err.message }))
      .finally(() => setLoadingHealth(false));
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const updated = updateGuestName(nameInput.trim());
    setGuest(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetIdentity = () => {
    if (!window.confirm('Reset your guest identity? Saved universes tied to your previous ID will be preserved in the archive.')) return;
    localStorage.removeItem('whatif_guest_identity_v1');
    const fresh = getGuestIdentity();
    setGuest(fresh);
    setNameInput(fresh.name);
  };

  return (
    <div className="w-full page-container-narrow py-10 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-[rgba(49,35,49,0.12)]">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#654D63] uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5 text-[#30152F]" /> Identity & System Diagnostics
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#200F22] tracking-tight">
          Settings & Identity
        </h1>
        <p className="text-xs sm:text-sm text-[#654D63] mt-1">
          Configure player identity, preferences, and inspect active neural and database connections.
        </p>
      </div>

      {/* Guest Profile Section */}
      <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-6 shadow-sm">
        <div>
          <h2 className="font-editorial font-bold text-2xl text-[#200F22] mb-1 flex items-center gap-2">
            <User className="w-5 h-5 text-[#30152F]" />
            Player Guest Profile
          </h2>
          <p className="text-xs text-[#654D63]">
            Your unique session identity is securely persisted in localStorage, tying your saved timelines and room participations together.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                Persistent Guest ID
              </label>
              <input
                type="text"
                value={guest.guestId}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-[#F2F1EE]/60 border border-[rgba(49,35,49,0.12)] text-xs font-mono text-[#7E6C7D] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetIdentity}
              className="text-xs text-[#7E6C7D] hover:text-[#A83842] font-mono transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Identity
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={savedSuccess ? Check : Save}
            >
              {savedSuccess ? 'Saved Successfully!' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Integration Status Section */}
      <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-6 shadow-sm">
        <div>
          <h2 className="font-editorial font-bold text-2xl text-[#200F22] mb-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#30152F]" />
            Backend & AI Connectivity Status
          </h2>
          <p className="text-xs text-[#654D63]">
            Real-time status of the local Node.js backend, MongoDB connection, and Groq LLM integration.
          </p>
        </div>

        {loadingHealth ? (
          <div className="py-8 text-center text-xs text-[#7E6C7D] font-mono">Checking system status...</div>
        ) : systemHealth ? (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-1">
                <span className="text-[11px] font-mono text-[#7E6C7D] uppercase block mb-1">Backend Server</span>
                <div className="flex items-center gap-2 font-bold text-sm text-[#200F22]">
                  <span className={`w-2 h-2 rounded-full ${systemHealth.status === 'healthy' ? 'bg-[#287A59]' : 'bg-[#A83842]'}`} />
                  {systemHealth.status === 'healthy' ? 'Online & Healthy' : 'Degraded'}
                </div>
                <span className="text-[10px] text-[#7E6C7D] font-mono">Port 5000</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-1">
                <span className="text-[11px] font-mono text-[#7E6C7D] uppercase block mb-1">Database</span>
                <div className="flex items-center gap-2 font-bold text-sm text-[#200F22]">
                  <span className={`w-2 h-2 rounded-full ${systemHealth.database?.isConnected ? 'bg-[#287A59]' : 'bg-[#A83842]'}`} />
                  {systemHealth.database?.isConnected ? 'MongoDB Connected' : 'Disconnected'}
                </div>
                <span className="text-[10px] text-[#7E6C7D] font-mono truncate block">{systemHealth.database?.name || 'whatif_movies'}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-1">
                <span className="text-[11px] font-mono text-[#7E6C7D] uppercase block mb-1">Groq Engine</span>
                <div className="flex items-center gap-2 font-bold text-sm text-[#200F22]">
                  <span className={`w-2 h-2 rounded-full ${systemHealth.integrations?.groq?.configured ? 'bg-[#287A59]' : 'bg-[#986421]'}`} />
                  {systemHealth.integrations?.groq?.configured ? 'Live Groq API' : 'Simulated RAG'}
                </div>
                <span className="text-[10px] text-[#7E6C7D] font-mono truncate block">{systemHealth.integrations?.groq?.model || 'llama-3.3-70b'}</span>
              </div>

            </div>

            {!systemHealth.integrations?.groq?.configured && (
              <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-xs text-[#654D63] space-y-1">
                <span className="font-semibold text-[#200F22] block">Optional Live Groq API:</span>
                <p className="text-[#654D63] leading-relaxed text-[11px]">
                  The application is currently running on the built-in, high-fidelity context-aware fallback engine. To enable real-time calls to Groq (Llama 3.3 70B), add your <code className="font-mono text-[#200F22] bg-[#E8E6E2] px-1 py-0.5 rounded border border-[rgba(49,35,49,0.15)]">GROQ_API_KEY</code> in <code className="font-mono text-[#200F22] bg-[#E8E6E2] px-1 py-0.5 rounded border border-[rgba(49,35,49,0.15)]">server/.env</code>.
                </p>
              </div>
            )}

          </div>
        ) : null}

      </div>

    </div>
  );
};

export default SettingsPage;
