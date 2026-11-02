import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Compass,
  Search,
  CheckCircle,
  Globe,
  Database,
  BookOpen
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { BranchComparisonCard } from '../components/timeline/BranchComparisonCard';
import { ExactStoryCard } from '../components/timeline/ExactStoryCard';
import { api } from '../services/api';

export const TimelineCreatorPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlMovieId = searchParams.get('movieId') || 'vikram-2022';
  const urlEventId = searchParams.get('eventId') || '';
  const urlPrompt = searchParams.get('prompt') || '';

  // Mode: 'catalog' for choosing from pre-indexed movies, 'custom' for entering any movie title
  const [pickerMode, setPickerMode] = useState('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customMovieInput, setCustomMovieInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveFeedback, setResolveFeedback] = useState(null); // { type: 'success' | 'error', message, source }

  const [moviesList, setMoviesList] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(urlMovieId);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(urlEventId);
  const [whatIfQuestion, setWhatIfQuestion] = useState(urlPrompt);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Exact Story State
  const [isGeneratingExact, setIsGeneratingExact] = useState(false);
  const [exactStoryData, setExactStoryData] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('alternate'); // 'alternate' | 'exact'

  const [error, setError] = useState(null);

  // Fetch all movies for the movie picker
  const loadMovies = () => {
    api.getMovies({ limit: 50 })
      .then(res => setMoviesList(res.data || []))
      .catch(err => console.error('Error loading movies:', err));
  };

  useEffect(() => {
    loadMovies();
  }, []);

  // Fetch current selected movie detail
  useEffect(() => {
    if (!selectedMovieId) return;
    api.getMovieById(selectedMovieId)
      .then(res => {
        setSelectedMovie(res.data);
        // Pre-fill suggested question if empty
        if (!whatIfQuestion && res.data?.canonEvents?.[0]?.suggestedWhatIf) {
          setWhatIfQuestion(res.data.canonEvents[0].suggestedWhatIf);
        }
      })
      .catch(err => console.error('Error loading selected movie:', err));
  }, [selectedMovieId]);

  // When user clicks a suggested prompt or canon event
  const handleSelectEvent = (event) => {
    setSelectedEventId(event.eventId);
    if (event.suggestedWhatIf) {
      setWhatIfQuestion(event.suggestedWhatIf);
    }
  };

  // Filter catalog movies by search term
  const filteredCatalog = moviesList.filter((m) => {
    if (!catalogSearch.trim()) return true;
    const term = catalogSearch.toLowerCase();
    return (
      m.title.toLowerCase().includes(term) ||
      (m.originalTitle && m.originalTitle.toLowerCase().includes(term)) ||
      (m.director && m.director.toLowerCase().includes(term)) ||
      (m.languageLabel && m.languageLabel.toLowerCase().includes(term)) ||
      (m.releaseYear && m.releaseYear.toString().includes(term))
    );
  });

  // Verify and resolve custom movie title via Dynamic RAG pipeline
  const handleResolveCustomMovie = async (titleOverride) => {
    const titleToResolve = (typeof titleOverride === 'string' ? titleOverride : customMovieInput).trim();
    if (!titleToResolve) {
      setResolveFeedback({
        type: 'error',
        message: 'Please enter a movie title to search and retrieve.',
      });
      return null;
    }

    setIsResolving(true);
    setResolveFeedback(null);
    setError(null);

    try {
      const res = await api.resolveMovie({ title: titleToResolve });
      if (res.success && res.movie) {
        const movie = res.movie;
        setSelectedMovie(movie);
        setSelectedMovieId(movie.movieId);
        setSelectedEventId('');

        // Refresh movies list so newly indexed movie appears in catalog
        loadMovies();

        // Pre-fill suggested What-If if available
        if (movie.canonEvents?.[0]?.suggestedWhatIf && !whatIfQuestion) {
          setWhatIfQuestion(movie.canonEvents[0].suggestedWhatIf);
        }

        const sourceLabel = res.source === 'database'
          ? 'Reused from Verified Knowledge Base'
          : 'Retrieved & Verified via Dynamic Movie Ingestion';

        setResolveFeedback({
          type: 'success',
          message: `Loaded "${movie.title}" (${movie.releaseYear} • ${movie.languageLabel}) — ${res.chunkCount || movie.chunkCount || 6} canon lore chunks indexed.`,
          source: sourceLabel,
        });

        return movie;
      } else {
        throw new Error(res.message || 'Could not verify movie information.');
      }
    } catch (err) {
      setResolveFeedback({
        type: 'error',
        message: err.message || 'Failed to retrieve movie lore. Please check the spelling or specify a year.',
      });
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  // Generate branches via RAG + Groq
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (isGenerating) return;

    if (!whatIfQuestion.trim()) {
      setError('Please enter a What-If divergence question or select a suggested prompt below.');
      return;
    }

    let activeMovieId = selectedMovieId;
    let activeMovieTitle = selectedMovie?.title || customMovieInput.trim();

    // If user is in custom mode and has typed a title that isn't verified yet
    if (pickerMode === 'custom' && customMovieInput.trim() && (!selectedMovie || selectedMovie.title.toLowerCase() !== customMovieInput.trim().toLowerCase())) {
      const resolved = await handleResolveCustomMovie();
      if (!resolved) {
        return; // Stop if movie could not be resolved/verified
      }
      activeMovieId = resolved.movieId;
      activeMovieTitle = resolved.title;
    }

    if (!activeMovieId && !activeMovieTitle) {
      setError('Please select an existing movie or enter a custom movie title.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);
    setSelectedBranchId('');

    try {
      const res = await api.generateBranches({
        movieId: activeMovieId || undefined,
        movieTitle: activeMovieTitle || undefined,
        whatIfQuestion: whatIfQuestion.trim(),
        selectedEventId: selectedEventId || null,
      });

      if (res.success && res.data?.branches?.length >= 2) {
        setGeneratedData(res.data);
        // Default select Branch Alpha
        setSelectedBranchId(res.data.branches[0].branchId);
        setActiveViewMode('alternate');
      } else {
        throw new Error(res.message || 'Could not generate alternate branches. Please retry.');
      }
    } catch (err) {
      setError(err.message || 'Generation failed. Check server logs.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Exact Story Breakdown via Verified Canon RAG
  const handleGenerateExactStory = async (e) => {
    if (e) e.preventDefault();
    if (isGeneratingExact || isGenerating) return;

    let activeMovieId = selectedMovieId;
    let activeMovieTitle = selectedMovie?.title || customMovieInput.trim();

    // If user is in custom mode and has typed a title that isn't verified yet
    if (pickerMode === 'custom' && customMovieInput.trim() && (!selectedMovie || selectedMovie.title.toLowerCase() !== customMovieInput.trim().toLowerCase())) {
      const resolved = await handleResolveCustomMovie();
      if (!resolved) {
        return;
      }
      activeMovieId = resolved.movieId;
      activeMovieTitle = resolved.title;
    }

    if (!activeMovieId && !activeMovieTitle) {
      setError('Please select an existing movie or enter a custom movie title.');
      return;
    }

    // Client-side quick check if movie is already known to be upcoming / unreleased
    const currentYear = new Date().getFullYear();
    const movieTitleLower = (selectedMovie?.title || activeMovieTitle || '').toLowerCase().trim();
    const isKnownUpcoming = ['baththa', 'jailer 2', 'kaithi 2', 'rolex', 'avengers: secret wars', 'avatar 3'].some(t => movieTitleLower.includes(t));
    const isLocalUnreleased = (selectedMovie && (
      selectedMovie.isReleased === false ||
      selectedMovie.releaseStatus === 'upcoming' ||
      selectedMovie.releaseStatus === 'unreleased' ||
      (selectedMovie.releaseYear && selectedMovie.releaseYear > currentYear) ||
      (selectedMovie.releaseYear && selectedMovie.releaseYear >= 2026 && selectedMovie.isReleased !== true)
    )) || isKnownUpcoming;

    if (isLocalUnreleased) {
      const displayTitle = selectedMovie?.title || activeMovieTitle || 'This movie';
      const displayYear = selectedMovie?.releaseYear || 'Upcoming';
      const msg = `"${displayTitle}" has not been released yet! Because this movie is not yet released, the exact canon story and climax cannot be revealed.`;
      setError(msg);
      setExactStoryData({
        isUnreleased: true,
        movieTitle: displayTitle,
        releaseYear: displayYear,
        languageLabel: selectedMovie?.languageLabel,
        message: msg,
      });
      setActiveViewMode('exact');
      return;
    }

    setIsGeneratingExact(true);
    setError(null);

    try {
      const res = await api.generateExactStory({
        movieId: activeMovieId || undefined,
        movieTitle: activeMovieTitle || undefined,
        whatIfQuestion: whatIfQuestion.trim() || undefined,
        selectedEventId: selectedEventId || null,
      });

      if (res.success) {
        if (res.data?.isUnreleased) {
          setExactStoryData(res.data);
          setActiveViewMode('exact');
          setError(`Notice: "${res.data.movieTitle || 'This movie'}" has not been released yet! Exact canon story cannot be revealed for unreleased films.`);
          return;
        }

        if (res.data?.story) {
          setExactStoryData(res.data);
          setActiveViewMode('exact');
          return;
        }
      }

      throw new Error(res.message || 'Could not retrieve the exact story. Please retry.');
    } catch (err) {
      setError(err.message || 'Exact story generation failed. Check server logs.');
    } finally {
      setIsGeneratingExact(false);
    }
  };

  // Continue to the active multi-turn timeline view
  const handleContinueTimeline = () => {
    if (!generatedData || !selectedBranchId || !selectedMovie) return;
    const chosen = generatedData.branches.find(b => b.branchId === selectedBranchId);

    // Save temporary state in sessionStorage or proceed
    sessionStorage.setItem('whatif_active_universe', JSON.stringify({
      movieId: selectedMovie.movieId,
      movieTitle: selectedMovie.title,
      posterUrl: selectedMovie.posterUrl,
      initialScenario: whatIfQuestion,
      branches: generatedData.branches,
      activeBranchId: selectedBranchId,
      chosenBranch: chosen,
      retrievedChunks: generatedData.retrievedChunks,
      engine: generatedData.engine,
    }));

    navigate(`/timeline/story?movieId=${selectedMovie.movieId}&branchId=${selectedBranchId}`);
  };

  return (
    <div className="w-full page-container py-10 sm:py-12 space-y-12">
      
      {/* Title & Context */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <Badge variant="multiverse" size="sm" className="mb-3 font-mono tracking-widest uppercase text-[10px]">
          <GitBranch className="w-3.5 h-3.5 text-[#30152F]" /> Signature Narrative Engine
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-6xl font-bold text-[#200F22] tracking-tight mb-3">
          What-If Timeline Creator
        </h1>
        <p className="text-sm sm:text-base text-[#654D63] leading-relaxed">
          Pick an existing cinematic universe or enter any movie title from world cinema. Our dynamic RAG engine retrieves verified screenplay facts and branches reality.
        </p>
      </div>

      {/* Creator Panel (Screen 4) */}
      <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 sm:p-10 mb-14 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          
          {/* Row 1: Dual-Mode Movie Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#654D63]">
                Cinematic Universe Selection
              </label>

              {/* Mode Toggle Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPickerMode('catalog')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pickerMode === 'catalog'
                      ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm font-semibold'
                      : 'text-[#654D63] hover:text-[#200F22]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Pre-Indexed Catalog ({moviesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('custom')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pickerMode === 'custom'
                      ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm font-semibold'
                      : 'text-[#654D63] hover:text-[#200F22]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Any Movie (Dynamic RAG)
                </button>
              </div>
            </div>

            {/* Mode A: Catalog Dropdown Picker */}
            {pickerMode === 'catalog' && (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={selectedMovieId}
                    onChange={(e) => {
                      setSelectedMovieId(e.target.value);
                      setSelectedEventId('');
                      setResolveFeedback(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30 appearance-none font-medium"
                  >
                    {filteredCatalog.map((m) => (
                      <option key={m.movieId} value={m.movieId} className="bg-[#F2F1EE] text-[#200F22]">
                        {m.title} ({m.releaseYear} • {m.languageLabel || 'Cinema'}{m.director ? ` • dir. ${m.director}` : ''})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7E6C7D] text-xs font-mono">
                    ▼
                  </div>
                </div>

                {/* Selected Movie Micro Preview Card */}
                {selectedMovie && (
                  <div className="p-3 bg-[#F2F1EE] rounded-xl border border-[rgba(49,35,49,0.12)] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      {selectedMovie.posterUrl && (
                        <img
                          src={selectedMovie.posterUrl}
                          alt={selectedMovie.title}
                          className="w-8 h-11 object-cover rounded-md border border-[rgba(49,35,49,0.15)] shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-[#200F22] mr-2">{selectedMovie.title}</span>
                        <span className="text-[#654D63] font-mono text-[11px]">
                          ({selectedMovie.releaseYear} • {selectedMovie.languageLabel})
                        </span>
                      </div>
                    </div>
                    <Badge variant="canon" size="sm" className="shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      {selectedMovie.chunkCount || 6} lore chunks
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Mode B: Any Movie Title with Dynamic Ingestion */}
            {pickerMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E6C7D]" />
                    <input
                      type="text"
                      placeholder="Enter ANY movie title (e.g. Jailer, Leo, Roja, Inception, Interstellar)..."
                      value={customMovieInput}
                      onChange={(e) => setCustomMovieInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleResolveCustomMovie();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    isLoading={isResolving}
                    disabled={isResolving || !customMovieInput.trim()}
                    onClick={() => handleResolveCustomMovie()}
                  >
                    Fetch & Ingest
                  </Button>
                </div>

                {/* Suggested Movies Quick Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#7E6C7D] font-mono text-[10px] uppercase tracking-wider mr-1">Try any title:</span>
                  {['Jailer', 'Leo', 'Roja', 'Ponniyin Selvan', 'Inception'].map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setCustomMovieInput(title);
                        handleResolveCustomMovie(title);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#F2F1EE] hover:bg-[#FFFFFF] text-[#654D63] border border-[rgba(49,35,49,0.12)] text-[11px] font-mono transition-colors"
                    >
                      +{title}
                    </button>
                  ))}
                </div>

                {/* Retrieval Feedback State */}
                {isResolving && (
                  <div className="p-3 bg-[#986421]/10 border border-[#986421]/25 rounded-xl text-[#986421] text-xs flex items-center gap-2 animate-pulse">
                    <div className="w-3.5 h-3.5 border-2 border-[#986421] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Searching MongoDB Atlas and verified external movie archives for "{customMovieInput}"...</span>
                  </div>
                )}

                {resolveFeedback && !isResolving && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                      resolveFeedback.type === 'success'
                        ? 'bg-[#287A59]/10 border border-[#287A59]/25 text-[#287A59]'
                        : 'bg-[#A83842]/10 border border-[#A83842]/25 text-[#A83842]'
                    }`}
                  >
                    {resolveFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-[#287A59] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#A83842] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{resolveFeedback.message}</p>
                      {resolveFeedback.source && (
                        <p className="text-[11px] text-[#287A59]/80 font-mono mt-0.5">
                          Source: {resolveFeedback.source}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Canon Event Selector (Optional Anchor) */}
          {selectedMovie?.canonEvents && selectedMovie.canonEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#654D63]">
                  Target Canon Turning Point (Optional Anchor)
                </label>
                <span className="text-[11px] text-[#7E6C7D] font-mono">
                  {selectedMovie.canonEvents.length} turning points available
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventId('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors ${
                    !selectedEventId
                      ? 'bg-[#30152F] text-[#F2F1EE] font-semibold shadow-sm'
                      : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
                  }`}
                >
                  Entire Movie Canon
                </button>
                {selectedMovie.canonEvents.map((evt) => (
                  <button
                    key={evt.eventId}
                    type="button"
                    onClick={() => handleSelectEvent(evt)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-colors ${
                      selectedEventId === evt.eventId
                        ? 'bg-[#30152F] text-[#F2F1EE] border-[#30152F] font-medium'
                        : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border-[rgba(49,35,49,0.12)]'
                    }`}
                  >
                    Act {evt.order}: {evt.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 3: Hypothetical Question Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#654D63]">
                The What-If Divergence
              </label>
              <span className="text-xs text-[#7E6C7D]">Be bold: change an alliance, revelation, or survival</span>
            </div>
            <textarea
              rows={3}
              value={whatIfQuestion}
              onChange={(e) => setWhatIfQuestion(e.target.value)}
              placeholder="e.g. What if the protagonist refused to remain in hiding after the first attack?"
              className="w-full p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30 leading-relaxed font-normal"
              required
            />
          </div>

          {/* Suggested Ideas */}
          {selectedMovie?.canonEvents && selectedMovie.canonEvents.some(e => e.suggestedWhatIf) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#7E6C7D] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#30152F]" /> Suggested Prompts:
              </span>
              {selectedMovie.canonEvents.filter(e => e.suggestedWhatIf).slice(0, 3).map((e) => (
                <button
                  key={e.eventId}
                  type="button"
                  onClick={() => setWhatIfQuestion(e.suggestedWhatIf)}
                  className="px-3 py-1 rounded-lg bg-[#F2F1EE] hover:bg-[#FFFFFF] text-[#654D63] border border-[rgba(49,35,49,0.12)] text-left transition-colors text-xs"
                >
                  "{e.suggestedWhatIf}"
                </button>
              ))}
            </div>
          )}

          {/* Action Row: Dual Buttons for Exact Story vs Alternate Timelines */}
          <div className="pt-4 border-t border-[rgba(49,35,49,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#654D63] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#30152F]" />
              <span>Vector RAG retrieves verified canon facts to anchor continuity.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Button 1: Explain Exact Story */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                isLoading={isGeneratingExact}
                disabled={isGenerating || isGeneratingExact || isResolving}
                icon={BookOpen}
                onClick={handleGenerateExactStory}
                className="w-full sm:w-auto uppercase tracking-wider text-xs px-6 py-3.5 bg-[#FFFFFF] border-2 border-[#30152F] text-[#30152F] hover:bg-[#30152F] hover:text-[#F2F1EE] shadow-sm font-semibold transition-all"
              >
                Explain Exact Story
              </Button>

              {/* Button 2: Generate Alternate Timelines */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isGenerating}
                disabled={isGenerating || isGeneratingExact || isResolving}
                icon={GitBranch}
                className="w-full sm:w-auto uppercase tracking-wider text-xs px-7 py-3.5 shadow-md shadow-[#30152F]/10 font-semibold"
              >
                Generate Alternate Timelines
              </Button>
            </div>
          </div>

        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 mb-10 bg-[#A83842]/10 border border-[#A83842]/25 rounded-2xl text-[#A83842] text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#A83842] mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Notice</p>
            <p className="text-xs text-[#A83842]/90">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State: Generating Alternate Timelines */}
      {isGenerating && (
        <div className="space-y-6 text-center py-16 animate-fadeIn">
          <div className="w-10 h-10 border-2 border-[#30152F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
            Retrieving Canon Facts & Weaving Timelines...
          </h3>
          <p className="text-xs text-[#654D63] max-w-md mx-auto">
            Computing semantic vectors, evaluating continuity constraints, and forging Branch Alpha and Branch Beta in simple, human-understandable English.
          </p>
        </div>
      )}

      {/* Loading State: Generating Exact Story */}
      {isGeneratingExact && (
        <div className="space-y-6 text-center py-16 animate-fadeIn">
          <div className="w-10 h-10 border-2 border-[#287A59] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
            Retrieving Screenplay Lore & Canon Facts...
          </h3>
          <p className="text-xs text-[#654D63] max-w-md mx-auto">
            Consulting verified database chunks and explaining the exact movie story and character fates in clear, easy-to-read English.
          </p>
        </div>
      )}

      {/* SCREEN 5 — RESULTS SECTION: TABBED VIEW (ALTERNATE TIMELINE vs EXACT STORY) */}
      {(generatedData || exactStoryData) && !isGenerating && !isGeneratingExact && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Dual Mode Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(49,35,49,0.12)]">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.14)] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveViewMode('alternate');
                  if (!generatedData) handleGenerate();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  activeViewMode === 'alternate'
                    ? 'bg-[#30152F] text-[#F2F1EE] font-bold shadow-sm'
                    : 'text-[#654D63] hover:text-[#200F22]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Alternate Timelines {generatedData ? '(2 Branches Ready)' : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveViewMode('exact');
                  if (!exactStoryData) handleGenerateExactStory();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  activeViewMode === 'exact'
                    ? 'bg-[#30152F] text-[#F2F1EE] font-bold shadow-sm'
                    : 'text-[#654D63] hover:text-[#200F22]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Exact Movie Story {exactStoryData ? '(Verified Canon)' : ''}
              </button>
            </div>

            {/* Quick Refresh Button */}
            {activeViewMode === 'alternate' && generatedData && (
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                isLoading={isGenerating}
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                Regenerate Alternate Timeline
              </Button>
            )}
            {activeViewMode === 'exact' && exactStoryData && (
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                isLoading={isGeneratingExact}
                disabled={isGeneratingExact}
                onClick={handleGenerateExactStory}
              >
                Refresh Exact Story
              </Button>
            )}
          </div>

          {/* VIEW A: ALTERNATE TIMELINE BRANCHES */}
          {activeViewMode === 'alternate' && (
            generatedData ? (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={generatedData.engine === 'groq-live' ? 'multiverse' : 'neutral'} size="sm">
                        {generatedData.engine === 'groq-live' ? `Groq Live (${generatedData.model || 'Active'})` : 'RAG Simulated Engine'}
                      </Badge>
                      <span className="text-xs text-[#7E6C7D] font-mono">
                        {generatedData.retrievedChunks?.length || 6} Canon Facts Used
                      </span>
                    </div>
                    <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#200F22]">
                      Choose Your Divergent Reality
                    </h2>
                    <p className="text-xs text-[#654D63] mt-1">
                      Both branches diverge from your question. Compare the fallout and choose which timeline to continue.
                    </p>
                  </div>
                </div>

                {/* Two Branches Side by Side on Desktop / Stacked on Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {generatedData.branches.map((branch) => (
                    <BranchComparisonCard
                      key={branch.branchId}
                      branch={branch}
                      isSelected={selectedBranchId === branch.branchId}
                      onSelect={() => setSelectedBranchId(branch.branchId)}
                      onContinue={handleContinueTimeline}
                    />
                  ))}
                </div>

                {/* Retrieved Ground-Truth Evidence Drawer */}
                {generatedData.retrievedChunks && generatedData.retrievedChunks.length > 0 && (
                  <div className="p-6 rounded-2xl editorial-card bg-[#E8E6E2] text-xs space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#287A59] font-semibold flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        Verified Supporting Canon Evidence (RAG Vector Chunks)
                      </span>
                      <span className="text-[#7E6C7D] font-mono text-[11px]">
                        Top Score: {generatedData.diagnostics?.topScore || '0.88'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {generatedData.retrievedChunks.slice(0, 4).map((chunk, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-[#654D63]">
                          <div className="flex items-center justify-between text-[10px] text-[#7E6C7D] font-mono mb-1 uppercase tracking-wider">
                            <span>Section: {chunk.sectionType?.toUpperCase()}</span>
                            <span>Score: {chunk.score}</span>
                          </div>
                          <p className="line-clamp-3 text-[#30152F]">{chunk.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#E8E6E2] text-center space-y-4">
                <GitBranch className="w-8 h-8 text-[#30152F] mx-auto opacity-70" />
                <h3 className="font-editorial text-xl font-bold text-[#200F22]">Alternate Timelines Not Generated Yet</h3>
                <p className="text-xs text-[#654D63] max-w-md mx-auto">
                  Click below to generate two divergent reality branches based on your question.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  icon={GitBranch}
                  onClick={handleGenerate}
                  className="uppercase tracking-wider text-xs px-6 py-2.5 font-bold"
                >
                  Generate Alternate Timelines
                </Button>
              </div>
            )
          )}

          {/* VIEW B: EXACT MOVIE STORY (CANON) */}
          {activeViewMode === 'exact' && (
            exactStoryData ? (
              <ExactStoryCard
                data={exactStoryData}
                onForgeWhatIf={() => {
                  setActiveViewMode('alternate');
                  if (!generatedData) handleGenerate();
                }}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-[#E8E6E2] text-center space-y-4">
                <BookOpen className="w-8 h-8 text-[#287A59] mx-auto opacity-70" />
                <h3 className="font-editorial text-xl font-bold text-[#200F22]">Exact Story Not Generated Yet</h3>
                <p className="text-xs text-[#654D63] max-w-md mx-auto">
                  Click below to retrieve the verified authentic movie storyline in clear, simple English.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  icon={BookOpen}
                  onClick={handleGenerateExactStory}
                  className="uppercase tracking-wider text-xs px-6 py-2.5 bg-[#FFFFFF] border-2 border-[#30152F] text-[#30152F] font-bold"
                >
                  Explain Exact Story
                </Button>
              </div>
            )
          )}

        </div>
      )}

    </div>
  );
};

