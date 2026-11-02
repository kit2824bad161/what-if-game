import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitBranch, Globe, ShieldCheck, ArrowLeft, BookOpen, Users, Compass } from 'lucide-react';
import { CanonTimelineView } from '../components/movies/CanonTimelineView';
import { CharacterRoster } from '../components/movies/CharacterRoster';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { api } from '../services/api';

export const MovieDetailPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'characters' | 'plot' | 'rules'

  useEffect(() => {
    setLoading(true);
    api.getMovieById(movieId)
      .then(res => setMovie(res.data))
      .catch(err => setError(err.message || 'Movie not found.'))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#30152F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] py-20 px-4 text-center">
        <h2 className="text-2xl font-editorial font-bold text-[#A83842] mb-2">Movie Not Found</h2>
        <p className="text-sm text-[#654D63] mb-6">{error || 'This movie has not been ingested yet.'}</p>
        <Link to="/movies">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>Back to Movie Explorer</Button>
        </Link>
      </div>
    );
  }

  const fallbackBackdrop = 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1600&auto=format&fit=crop';
  const backdrop = movie.backdropUrl || fallbackBackdrop;

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#30152F] pb-24">
      
      {/* Hero Header with Cinematic Backdrop & Editorial Integration */}
      <div className="relative w-full h-[400px] sm:h-[480px] overflow-hidden bg-[#D5D2CD] border-b border-[rgba(49,35,49,0.12)]">
        <img
          src={backdrop}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter grayscale contrast-[1.05]"
        />
        {/* Soft Ice Silver Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F2F1EE] via-[#F2F1EE]/80 to-transparent" />
        <div className="absolute inset-0 bg-[rgba(48,21,47,0.05)] mix-blend-multiply" />

        {/* Back Link */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Link
            to="/movies"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F2F1EE]/90 backdrop-blur border border-[rgba(49,35,49,0.15)] text-xs font-mono uppercase tracking-wider text-[#30152F] hover:bg-[#FFFFFF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Movies
          </Link>
        </div>

        {/* Bottom Hero Info */}
        <div className="absolute bottom-8 left-0 right-0 page-container z-10 flex flex-col sm:flex-row items-start sm:items-end gap-6">
          
          {/* Floating Poster */}
          <div className="w-28 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-xl border-2 border-[rgba(49,35,49,0.15)] shrink-0 hidden xs:block bg-[#E8E6E2]">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = fallbackBackdrop; }}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={movie.language === 'ta' ? 'multiverse' : 'neutral'} size="sm">
                <Globe className="w-3 h-3" />
                {movie.languageLabel}
              </Badge>
              <Badge variant="canon" size="sm">
                <ShieldCheck className="w-3 h-3" />
                {movie.dataStatus === 'verified' ? 'Verified Canon' : 'Partial Canon'}
              </Badge>
              <span className="text-xs font-mono text-[#7E6C7D]">
                Released {movie.releaseYear} • Director {movie.director}
              </span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-6xl font-bold text-[#200F22] tracking-tight leading-tight">
              {movie.title}
            </h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs font-mono text-[#7E6C7D]">{movie.originalTitle}</p>
            )}

            <p className="text-xs sm:text-sm text-[#654D63] max-w-3xl line-clamp-2 leading-relaxed">
              {movie.overview}
            </p>
          </div>

          {/* Primary CTA */}
          <div className="shrink-0 self-stretch sm:self-auto flex items-center">
            <Link to={`/creator?movieId=${movie.movieId}`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                icon={GitBranch}
                className="w-full sm:w-auto uppercase tracking-wider text-xs px-7 py-3.5 shadow-md shadow-[#30152F]/10"
              >
                Forge Alternate Timeline
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="page-container mt-12">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[rgba(49,35,49,0.12)] pb-4 mb-8 overflow-x-auto text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'bg-[#30152F] text-[#F2F1EE] font-semibold shadow-sm'
                : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Canon Turning Points ({movie.canonEvents?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'characters'
                ? 'bg-[#30152F] text-[#F2F1EE] font-semibold shadow-sm'
                : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Characters & Motivations ({movie.characters?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('plot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'plot'
                ? 'bg-[#30152F] text-[#F2F1EE] font-semibold shadow-sm'
                : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Full Screenplay Summary
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'rules'
                ? 'bg-[#30152F] text-[#F2F1EE] font-semibold shadow-sm'
                : 'text-[#654D63] hover:text-[#200F22] hover:bg-[#E8E6E2]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            World Rules ({movie.worldRules?.length || 0})
          </button>
        </div>

        {/* Tab 1: Canon Timeline with What-If Launchers */}
        {activeTab === 'timeline' && (
          <div className="max-w-4xl space-y-6">
            <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl flex items-center justify-between text-xs text-[#654D63]">
              <span>Click "What If?" on any canon event to launch the timeline simulator anchored at that exact moment.</span>
              <span className="font-mono text-[#287A59] font-semibold text-[11px] uppercase tracking-wider">Verified Ground Truth</span>
            </div>
            <CanonTimelineView
              events={movie.canonEvents}
              movieId={movie.movieId}
              movieTitle={movie.title}
            />
          </div>
        )}

        {/* Tab 2: Characters */}
        {activeTab === 'characters' && (
          <div>
            <div className="mb-6 text-xs text-[#654D63]">
              Understanding established character motivations, allegiances, and emotional vulnerabilities ensures generated alternate timelines remain authentic.
            </div>
            <CharacterRoster characters={movie.characters} />
          </div>
        )}

        {/* Tab 3: Full Plot Summary */}
        {activeTab === 'plot' && (
          <div className="max-w-4xl editorial-card bg-[#E8E6E2] p-8 rounded-2xl space-y-6 leading-relaxed text-sm text-[#30152F] shadow-sm">
            <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
              Official Screenplay Narrative Architecture
            </h3>
            {movie.plotSummary.split('\n\n').map((para, i) => (
              <p key={i} className="text-[#654D63] leading-relaxed">{para}</p>
            ))}
            <div className="pt-6 border-t border-[rgba(49,35,49,0.12)] flex items-center justify-between text-xs text-[#7E6C7D] font-mono">
              <span>Attribution: {movie.sourceAttribution?.sources?.join(' • ') || 'Curated Canon'}</span>
              <span>RAG Chunk Index: {movie.chunkCount || 6} Chunks</span>
            </div>
          </div>
        )}

        {/* Tab 4: Universe Rules */}
        {activeTab === 'rules' && (
          <div className="max-w-3xl space-y-4">
            <div className="editorial-card bg-[#E8E6E2] p-4 rounded-xl text-xs text-[#654D63]">
              Universe rules define the fundamental boundaries of this reality (physics, morality, law enforcement, or supernatural constraints). Our continuity checker verifies every alternate branch against these laws.
            </div>
            <div className="space-y-3">
              {movie.worldRules?.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] flex items-start gap-3 text-sm text-[#30152F]">
                  <span className="font-mono text-[#986421] font-bold text-xs">Rule {idx + 1}</span>
                  <p className="text-[#654D63]">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
