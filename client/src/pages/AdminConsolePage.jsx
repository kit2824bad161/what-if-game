import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  RefreshCw,
  Database,
  Search,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
  Key,
  Server,
  Activity,
  Zap,
  Clock,
  ChevronRight,
  ExternalLink,
  Sliders,
  Check,
  X,
  FileText,
  Filter
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';

export const AdminConsolePage = () => {
  const [adminKey, setAdminKey] = useState('whatif_dev_admin_secret_2026');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active diagnostic panel view: 'retrieval' | 'inspector' | 'jobs' | 'system'
  const [activeTab, setActiveTab] = useState('retrieval');

  // Retrieval test console state
  const [testMovieId, setTestMovieId] = useState('vikram-2022');
  const [testQuery, setTestQuery] = useState('Amar discovers Karnan is alive and investigates the Pilot Wing black ops');
  const [testResult, setTestResult] = useState(null);
  const [testingRetrieval, setTestingRetrieval] = useState(false);

  // Movie Chunk Inspector state
  const [inspectMovieId, setInspectMovieId] = useState('vikram-2022');
  const [inspectedChunks, setInspectedChunks] = useState(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunkFilterType, setChunkFilterType] = useState('all');

  // Reseed state
  const [reseedModal, setReseedModal] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedFeedback, setReseedFeedback] = useState(null);

  // Fetch movies list for dropdowns
  const fetchMoviesList = async () => {
    try {
      const res = await api.getMovies({ limit: 50 });
      setMoviesList(res.data || []);
    } catch (e) {
      console.warn('Could not load movie list for admin selector:', e);
    }
  };

  // Fetch full system & admin diagnostics
  const fetchDiagnostics = async (key) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch system health (accessible public diagnostic)
      try {
        const healthRes = await api.getHealth();
        setHealthData(healthRes);
      } catch (hErr) {
        setHealthData({ status: 'degraded', error: hErr.message });
      }

      // 2. Fetch admin status (requires x-admin-key)
      const res = await api.getAdminStatus(key);
      setStatusData(res.diagnostics);
      setIsAuthenticated(true);

      // 3. Fetch recent ingestion jobs
      try {
        const jobsRes = await api.getAdminJobs(key);
        setJobs(jobsRes.data || []);
      } catch (jErr) {
        console.warn('Jobs fetch failed:', jErr);
      }

      // 4. Fetch movies list
      await fetchMoviesList();
    } catch (err) {
      setError(err.message || 'Authorization failed. Verify your developer admin secret key.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics(adminKey);
  }, []);

  const handleAuthenticate = (e) => {
    if (e) e.preventDefault();
    if (!adminKey.trim()) return;
    fetchDiagnostics(adminKey.trim());
  };

  const handleTestRetrieval = async (e) => {
    if (e) e.preventDefault();
    if (!testQuery.trim() || !testMovieId) return;

    setTestingRetrieval(true);
    setError(null);
    try {
      const res = await api.testRetrieval(
        {
          movieId: testMovieId,
          query: testQuery.trim(),
        },
        adminKey
      );
      setTestResult(res);
    } catch (err) {
      setError('Retrieval benchmark failed: ' + err.message);
    } finally {
      setTestingRetrieval(false);
    }
  };

  const handleLoadMovieChunks = async (movieId) => {
    if (!movieId) return;
    setLoadingChunks(true);
    setInspectMovieId(movieId);
    try {
      const res = await api.getAdminChunks(movieId, adminKey);
      setInspectedChunks(res);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleReseed = async () => {
    setReseedLoading(true);
    setReseedFeedback(null);
    try {
      const res = await api.reseedMovies(adminKey);
      const count = res.results?.length || 0;
      setReseedFeedback({
        type: 'success',
        message: `Successfully re-indexed and ingested ${count} movie knowledge bases into vector storage.`,
      });
      setReseedModal(false);
      fetchDiagnostics(adminKey);
    } catch (err) {
      setReseedFeedback({
        type: 'error',
        message: 'Reseed pipeline failed: ' + err.message,
      });
      setReseedModal(false);
    } finally {
      setReseedLoading(false);
    }
  };

  // Preset benchmark query shortcuts for developer convenience
  const benchmarkPresets = [
    {
      movieId: 'vikram-2022',
      query: 'Amar discovers Karnan is alive and investigates the Pilot Wing black ops',
      label: 'Vikram: Amar & Karnan',
    },
    {
      movieId: 'the-dark-knight-2008',
      query: 'Harvey Dent is saved from the warehouse instead of Rachel Dawes',
      label: 'Dark Knight: Dent Divergence',
    },
    {
      movieId: 'baahubali-2015',
      query: 'Kattappa confesses the royal betrayal and Mahishmati succession truth',
      label: 'Baahubali: Royal Treason',
    },
    {
      movieId: 'interstellar-2014',
      query: 'Cooper communicates coordinates via gravitational anomalies through the tesseract',
      label: 'Interstellar: Tesseract Rules',
    },
    {
      movieId: 'nayakan-1987',
      query: 'Velu Naicker faces the inspector son-in-law regarding Mumbai underworld justice',
      label: 'Nayakan: Underworld Justice',
    },
  ];

  const applyPreset = (preset) => {
    setTestMovieId(preset.movieId);
    setTestQuery(preset.query);
  };

  // Filtered inspected chunks
  const filteredChunks = inspectedChunks?.chunks?.filter((c) => {
    if (chunkFilterType === 'all') return true;
    return c.sectionType === chunkFilterType;
  }) || [];

  return (
    <div className="w-full page-container py-10 sm:py-12 space-y-8 relative">
      
      {/* Subtle Vertical Grid Lines Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 -z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(49, 35, 49, 0.08) 0px, rgba(49, 35, 49, 0.08) 1px, transparent 1px, transparent 140px)',
        }}
      />

      <div className="relative z-10 space-y-8">

        {/* Top Developer Meta Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono uppercase tracking-[0.22em] text-[#654D63] pb-4 border-b border-[rgba(49,35,49,0.12)]">
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#30152F]" />
            DEVELOPER & DIAGNOSTIC CONSOLE • SYSTEM MONITOR
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAuthenticated ? 'bg-[#287A59]' : 'bg-[#A83842]'
                }`}
              />
              {isAuthenticated ? 'AUTHORIZED' : 'ACCESS RESTRICTED'}
            </span>
            <span className="text-[rgba(49,35,49,0.2)]">|</span>
            <span className="text-[#7E6C7D]">ENV: {import.meta.env.MODE || 'production'}</span>
          </div>
        </div>

        {/* Header and Authentication Control */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[rgba(49,35,49,0.12)]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E6E2] border border-[rgba(49,35,49,0.15)] text-[11px] font-mono tracking-widest uppercase text-[#30152F] mb-3 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#30152F]" />
              <span>RAG 2.0 & AI Diagnostic Telemetry</span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#200F22] tracking-tight mb-2">
              Dev Diagnostics Console
            </h1>
            <p className="text-sm text-[#654D63] leading-relaxed">
              Inspect RAG vector chunks, verify cosine similarity scores, monitor ingestion pipelines, and audit system integrity with ground-truth backend metrics.
            </p>
          </div>

          {/* Admin Secret Authentication Box */}
          <form
            onSubmit={handleAuthenticate}
            className="editorial-card bg-[#E8E6E2] p-3.5 rounded-2xl border border-[rgba(49,35,49,0.15)] flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-sm"
          >
            <div className="relative flex-1 sm:w-60">
              <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E6C7D]" />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin Secret Key"
                className="w-full pl-8 pr-3 py-1.5 bg-[#F2F1EE] border border-[rgba(49,35,49,0.16)] rounded-xl text-xs font-mono text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              className="text-xs font-mono uppercase tracking-wider whitespace-nowrap"
            >
              Verify Access
            </Button>
          </form>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="editorial-card bg-[#A83842]/10 border border-[#A83842]/30 rounded-2xl p-4 text-[#A83842] flex items-center justify-between text-xs animate-fadeIn">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {reseedFeedback && (
          <div
            className={`editorial-card p-4 rounded-2xl text-xs flex items-center justify-between animate-fadeIn ${
              reseedFeedback.type === 'error'
                ? 'bg-[#A83842]/10 border border-[#A83842]/30 text-[#A83842]'
                : 'bg-[#287A59]/10 border border-[#287A59]/30 text-[#287A59]'
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              {reseedFeedback.message}
            </span>
            <button onClick={() => setReseedFeedback(null)} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real Live Connection Status Indicator Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Backend Status */}
          <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl border border-[rgba(49,35,49,0.12)] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#7E6C7D] tracking-wider flex items-center gap-1.5">
              <Server className="w-3 h-3 text-[#30152F]" />
              Backend Server
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.status === 'healthy' ? 'bg-[#287A59] animate-pulse' : 'bg-[#A83842]'
                }`}
              />
              <span className="font-mono text-xs font-bold text-[#200F22] uppercase">
                {healthData?.status || 'Checking...'}
              </span>
            </div>
            <div className="text-[10px] text-[#7E6C7D] font-mono">
              {healthData?.uptimeSeconds !== undefined
                ? `Uptime: ${Math.floor(healthData.uptimeSeconds / 60)}m ${healthData.uptimeSeconds % 60}s`
                : 'Port 5000'}
            </div>
          </div>

          {/* MongoDB Status */}
          <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl border border-[rgba(49,35,49,0.12)] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#7E6C7D] tracking-wider flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#30152F]" />
              MongoDB Database
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.database?.isConnected ? 'bg-[#287A59]' : 'bg-[#A83842]'
                }`}
              />
              <span className="font-mono text-xs font-bold text-[#200F22] uppercase">
                {healthData?.database?.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-[10px] text-[#7E6C7D] font-mono truncate">
              {healthData?.database?.name
                ? `${healthData.database.name} (${healthData.database.host || 'local'})`
                : statusData?.integrations?.database?.type || 'Not checked'}
            </div>
          </div>

          {/* Groq LLM Status */}
          <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl border border-[rgba(49,35,49,0.12)] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#7E6C7D] tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#30152F]" />
              Groq AI Engine
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  statusData?.integrations?.groq?.configured ? 'bg-[#287A59]' : 'bg-[#986421]'
                }`}
              />
              <span className="font-mono text-xs font-bold text-[#200F22] uppercase">
                {statusData?.integrations?.groq?.configured ? 'Live Groq API' : 'Simulated RAG'}
              </span>
            </div>
            <div className="text-[10px] text-[#7E6C7D] font-mono truncate">
              {statusData?.integrations?.groq?.model || 'llama-3.3-70b'}
            </div>
          </div>

          {/* Embeddings Status */}
          <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl border border-[rgba(49,35,49,0.12)] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#7E6C7D] tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-[#30152F]" />
              Vector Embeddings
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#287A59]" />
              <span className="font-mono text-xs font-bold text-[#200F22] uppercase">
                {statusData?.integrations?.embeddings?.provider?.toUpperCase() || 'LOCAL'}
              </span>
            </div>
            <div className="text-[10px] text-[#7E6C7D] font-mono">
              {statusData?.embeddingDimensions || 128}-dim normalized cosine
            </div>
          </div>
        </div>

        {/* High-Level Metrics Grid */}
        {statusData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-2 shadow-sm">
              <span className="text-[11px] font-mono uppercase text-[#654D63] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#30152F]" />
                Ingested Movies
              </span>
              <div className="font-editorial text-3xl font-bold text-[#200F22]">
                {statusData.movieCount}{' '}
                <span className="text-xs text-[#287A59] font-mono font-normal">
                  ({statusData.verifiedMovies} Verified)
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#7E6C7D]">Tamil Cinema & Global Classics</p>
            </div>

            <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-2 shadow-sm">
              <span className="text-[11px] font-mono uppercase text-[#654D63] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#30152F]" />
                Vector Chunks
              </span>
              <div className="font-editorial text-3xl font-bold text-[#200F22]">
                {statusData.chunkCount}
              </div>
              <div className="flex flex-wrap gap-1 text-[9px] font-mono text-[#654D63]">
                <span>P:{statusData.chunksByType?.plot || 0}</span>
                <span>•</span>
                <span>T:{statusData.chunksByType?.turning_point || 0}</span>
                <span>•</span>
                <span>C:{statusData.chunksByType?.character || 0}</span>
                <span>•</span>
                <span>W:{statusData.chunksByType?.world_rule || 0}</span>
              </div>
            </div>

            <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-2 shadow-sm">
              <span className="text-[11px] font-mono uppercase text-[#654D63] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#30152F]" />
                Ingestion Jobs
              </span>
              <div className="font-editorial text-3xl font-bold text-[#200F22]">
                {statusData.jobCount || jobs.length}
              </div>
              <p className="text-[10px] font-mono text-[#7E6C7D]">Audited Pipeline Batches</p>
            </div>

            <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-2 shadow-sm">
              <span className="text-[11px] font-mono uppercase text-[#654D63] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#30152F]" />
                Vector Engine
              </span>
              <div className="font-editorial text-3xl font-bold text-[#200F22]">
                128<span className="text-sm font-sans font-normal text-[#654D63]"> dim</span>
              </div>
              <p className="text-[10px] font-mono text-[#7E6C7D]">Cosine + Lexical Hybrid Search</p>
            </div>

          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="border-b border-[rgba(49,35,49,0.12)] flex items-center justify-between gap-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('retrieval')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'retrieval'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              RAG Retrieval Benchmark
            </button>

            <button
              onClick={() => {
                setActiveTab('inspector');
                if (!inspectedChunks) handleLoadMovieChunks(inspectMovieId);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'inspector'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Vector Chunk Inspector
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Ingestion Job Audits ({jobs.length})
            </button>
          </div>

          {/* Quick Reseed Action */}
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => setReseedModal(true)}
            className="text-xs font-mono uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            Re-Index Universes
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RAG RETRIEVAL BENCHMARK TESTER                                     */}
        {/* ========================================================================= */}
        {activeTab === 'retrieval' && (
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.14)] space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(49,35,49,0.12)] pb-4">
              <div>
                <h2 className="font-editorial font-bold text-2xl text-[#200F22] flex items-center gap-2.5">
                  <Search className="w-5 h-5 text-[#30152F]" />
                  RAG Vector Retrieval Benchmark
                </h2>
                <p className="text-xs text-[#654D63] mt-1">
                  Execute live vector queries against stored screenplay chunks to verify cosine similarity rankings and lexical hybrid weights.
                </p>
              </div>

              <div className="text-xs font-mono text-[#7E6C7D] hidden sm:block">
                Top-K: 5 • Algorithm: Cosine Hybrid
              </div>
            </div>

            {/* Presets Quick Picker */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#654D63] block">
                Quick Benchmark Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {benchmarkPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] hover:border-[#30152F]/40 text-[#30152F] font-medium transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Form */}
            <form onSubmit={handleTestRetrieval} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Movie Selector */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#654D63] block mb-1">
                    Target Canon Screenplay
                  </label>
                  <select
                    value={testMovieId}
                    onChange={(e) => setTestMovieId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.16)] text-xs font-medium text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
                  >
                    {moviesList.length > 0 ? (
                      moviesList.map((m) => (
                        <option key={m.movieId} value={m.movieId}>
                          {m.title} ({m.releaseYear})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="vikram-2022">Vikram (2022)</option>
                        <option value="the-dark-knight-2008">The Dark Knight (2008)</option>
                        <option value="baahubali-2015">Baahubali (2015)</option>
                        <option value="kaithi-2019">Kaithi (2019)</option>
                        <option value="nayakan-1987">Nayakan (1987)</option>
                        <option value="the-matrix-1999">The Matrix (1999)</option>
                        <option value="interstellar-2014">Interstellar (2014)</option>
                        <option value="super-deluxe-2019">Super Deluxe (2019)</option>
                        <option value="anbe-sivam-2003">Anbe Sivam (2003)</option>
                        <option value="thalapathi-1991">Thalapathi (1991)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Query Input */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#654D63] block mb-1">
                    Semantic Search Query / Hypothetical Divergence Prompt
                  </label>
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter query terms or hypothetical dilemma..."
                    className="w-full py-2 px-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.16)] text-xs text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={testingRetrieval}
                  icon={Search}
                >
                  Execute Vector Retrieval Benchmark
                </Button>

                <span className="text-[11px] font-mono text-[#7E6C7D] hidden md:inline">
                  Embeddings: 128-dim normalized cosine dot product
                </span>
              </div>
            </form>

            {/* Test Results Output */}
            {testResult && (
              <div className="space-y-4 pt-6 border-t border-[rgba(49,35,49,0.12)] animate-fadeIn">
                {/* Result Diagnostics Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#654D63] font-mono bg-[#F2F1EE] p-3.5 rounded-xl border border-[rgba(49,35,49,0.12)]">
                  <span className="font-semibold text-[#200F22]">
                    Retrieved: {testResult.diagnostics?.retrievedCount || testResult.chunks?.length || 0} chunks
                  </span>
                  <span>Duration: {testResult.diagnostics?.durationMs ?? 0} ms</span>
                  <span className="text-[#287A59] font-bold">
                    Top Score: {testResult.diagnostics?.topScore ?? 'N/A'}
                  </span>
                  <span>Method: {testResult.diagnostics?.method || 'hybrid_vector_lexical'}</span>
                </div>

                {/* Chunks List */}
                <div className="space-y-3">
                  {testResult.chunks?.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-2.5 text-xs shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#200F22]">
                            CHUNK #{chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : idx + 1}
                          </span>
                          <Badge variant="multiverse" size="sm">
                            {chunk.sectionType?.toUpperCase() || 'CANON'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#287A59] font-semibold bg-[#287A59]/10 px-2 py-0.5 rounded border border-[#287A59]/20">
                            Cosine Similarity: {(chunk.score * 100).toFixed(1)}%
                          </span>
                          {chunk.semanticScore !== undefined && (
                            <span className="text-[#7E6C7D]">
                              Vector: {chunk.semanticScore}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[#30152F] leading-relaxed font-sans text-xs sm:text-sm">
                        {chunk.text}
                      </p>

                      <div className="pt-2 border-t border-[rgba(49,35,49,0.08)] flex items-center justify-between text-[10px] text-[#7E6C7D] font-mono">
                        <span>Source: {chunk.attribution?.source || 'Movie Canon Screenplay'}</span>
                        {chunk.attribution?.confidence && (
                          <span>Confidence: {chunk.attribution.confidence}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MOVIE CHUNK INSPECTOR                                              */}
        {/* ========================================================================= */}
        {activeTab === 'inspector' && (
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.14)] space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(49,35,49,0.12)] pb-4">
              <div>
                <h2 className="font-editorial font-bold text-2xl text-[#200F22] flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#30152F]" />
                  Knowledge Base Vector Chunk Inspector
                </h2>
                <p className="text-xs text-[#654D63] mt-1">
                  Inspect raw semantic chunks and sample 128-dimensional vector representations stored in MongoDB.
                </p>
              </div>

              {/* Movie selector */}
              <div className="flex items-center gap-2">
                <select
                  value={inspectMovieId}
                  onChange={(e) => handleLoadMovieChunks(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.16)] text-xs font-medium text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
                >
                  {moviesList.length > 0 ? (
                    moviesList.map((m) => (
                      <option key={m.movieId} value={m.movieId}>
                        {m.title} ({m.releaseYear})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="vikram-2022">Vikram (2022)</option>
                      <option value="the-dark-knight-2008">The Dark Knight (2008)</option>
                      <option value="baahubali-2015">Baahubali (2015)</option>
                      <option value="kaithi-2019">Kaithi (2019)</option>
                    </>
                  )}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  isLoading={loadingChunks}
                  onClick={() => handleLoadMovieChunks(inspectMovieId)}
                >
                  Load
                </Button>
              </div>
            </div>

            {/* Filter by section type */}
            {inspectedChunks && (
              <div className="flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-[#654D63]">
                  Total Chunks: <strong>{inspectedChunks.chunkCount}</strong>
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['all', 'plot', 'turning_point', 'character', 'world_rule'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setChunkFilterType(type)}
                      className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px] font-semibold transition-all ${
                        chunkFilterType === type
                          ? 'bg-[#30152F] text-[#F2F1EE]'
                          : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chunks Display */}
            {loadingChunks ? (
              <div className="py-12 text-center text-xs font-mono text-[#654D63]">
                <div className="w-6 h-6 border-2 border-[#30152F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading vector chunks from MongoDB...
              </div>
            ) : filteredChunks.length === 0 ? (
              <div className="p-8 text-center bg-[#F2F1EE] rounded-xl border border-[rgba(49,35,49,0.12)] text-xs text-[#654D63]">
                No chunks found for the selected movie or filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-3 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#200F22]">
                          CHUNK #{chunk.chunkIndex + 1}
                        </span>
                        <Badge variant="multiverse" size="sm">
                          {chunk.sectionType?.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-[#7E6C7D]">
                        ID: {chunk.id}
                      </span>
                    </div>

                    <p className="text-[#200F22] leading-relaxed font-sans text-xs sm:text-sm">
                      {chunk.text}
                    </p>

                    {/* Embedding preview */}
                    {chunk.embeddingSample && chunk.embeddingSample.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-[#E8E6E2] border border-[rgba(49,35,49,0.08)] text-[10px] font-mono text-[#654D63] space-y-1">
                        <span className="text-[#7E6C7D] block">Vector Embedding Sample (128-dim):</span>
                        <code className="text-[#30152F] break-all">
                          [{chunk.embeddingSample.map((v) => Number(v).toFixed(4)).join(', ')}, ...]
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RECENT INGESTION JOBS & PIPELINE AUDITS                            */}
        {/* ========================================================================= */}
        {activeTab === 'jobs' && (
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.14)] space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(49,35,49,0.12)] pb-4">
              <div>
                <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
                  Recent Ingestion Jobs & Vector Audits
                </h3>
                <p className="text-xs text-[#654D63] mt-1">
                  History of semantic chunk decomposition, embedding generation, and database commits.
                </p>
              </div>

              <span className="text-xs font-mono text-[#7E6C7D]">
                Showing {Math.min(jobs.length, 30)} recent jobs
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 text-center bg-[#F2F1EE] rounded-xl border border-[rgba(49,35,49,0.12)] text-xs text-[#654D63]">
                No ingestion job records logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[rgba(49,35,49,0.12)] bg-[#F2F1EE]">
                <table className="w-full text-xs text-left text-[#30152F]">
                  <thead className="text-[11px] font-mono uppercase bg-[#E8E6E2] text-[#654D63] border-b border-[rgba(49,35,49,0.12)]">
                    <tr>
                      <th className="py-3 px-4">Job ID</th>
                      <th className="py-3 px-4">Movie</th>
                      <th className="py-3 px-4">Pipeline Stage</th>
                      <th className="py-3 px-4">Chunks</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(49,35,49,0.08)] font-mono">
                    {jobs.slice(0, 30).map((job) => (
                      <tr key={job.jobId} className="hover:bg-[#E8E6E2]/50 transition-colors">
                        <td className="py-3 px-4 text-[#7E6C7D]">{job.jobId}</td>
                        <td className="py-3 px-4 font-sans font-medium text-[#200F22]">
                          {job.movieTitle}
                        </td>
                        <td className="py-3 px-4 text-[#654D63]">{job.stage}</td>
                        <td className="py-3 px-4 font-bold text-[#200F22]">
                          {job.chunksCreated}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              job.status === 'completed'
                                ? 'bg-[#287A59]/10 text-[#287A59] border border-[#287A59]/20'
                                : 'bg-[#A83842]/10 text-[#A83842] border border-[#A83842]/20'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#7E6C7D]">
                          {job.createdAt
                            ? new Date(job.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Confirmation Modal for Potentially Destructive Reseed */}
      {reseedModal && (
        <div className="fixed inset-0 z-50 bg-[#200F22]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="editorial-card bg-[#F2F1EE] rounded-3xl p-6 sm:p-8 border border-[rgba(49,35,49,0.2)] max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#986421]/15 border border-[#986421]/25 flex items-center justify-center text-[#986421] shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[#200F22]">
                  Re-Index All Universes?
                </h3>
                <p className="text-xs font-mono text-[#7E6C7D] uppercase tracking-wider">
                  Knowledge Base Reseed
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
              This action triggers a full ingestion pipeline execution. It will re-parse canon screenplay turning points, re-compute 128-dimensional vector embeddings, and re-commit all chunks to MongoDB.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(49,35,49,0.12)]">
              <Button
                variant="outline"
                size="md"
                disabled={reseedLoading}
                onClick={() => setReseedModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={reseedLoading}
                icon={RefreshCw}
                onClick={handleReseed}
              >
                Confirm Re-Index
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminConsolePage;
