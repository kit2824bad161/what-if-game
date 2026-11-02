import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { GitBranch, Bookmark, Sparkles, Send, ArrowLeft, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { getGuestIdentity } from '../services/guestIdentity';

export const AlternateTimelineStoryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const movieId = searchParams.get('movieId');
  const branchId = searchParams.get('branchId');
  const existingTimelineId = searchParams.get('timelineId');

  const [universeData, setUniverseData] = useState(null);
  const [turns, setTurns] = useState([]);
  const [nextPrompt, setNextPrompt] = useState('');
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load active universe from sessionStorage or DB
  useEffect(() => {
    if (existingTimelineId) {
      // Re-opening an existing saved timeline from MongoDB
      api.getTimelineById(existingTimelineId)
        .then(res => {
          const t = res.data;
          setUniverseData({
            timelineId: t.timelineId,
            movieId: t.movieId,
            movieTitle: t.movieTitle,
            posterUrl: t.posterUrl,
            initialScenario: t.initialScenario,
            customTitle: t.customTitle,
            chosenBranch: t.initialBranches?.[0] || { title: t.customTitle, summary: t.initialScenario },
          });
          setTurns(t.turns || []);
        })
        .catch(err => setError('Failed to load saved timeline.'));
    } else {
      // Starting from newly generated branches
      const raw = sessionStorage.getItem('whatif_active_universe');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUniverseData(parsed);

          // Initial Turn (Act 1) forged from chosen branch
          const initialTurn = {
            turnNumber: 1,
            userPrompt: parsed.initialScenario,
            continuationTitle: parsed.chosenBranch?.title || 'Act 1: The First Divergence',
            narrativeText: parsed.chosenBranch?.summary || '',
            canonFactsReferenced: parsed.chosenBranch?.canonFactsUsed || [],
            newHypotheticalFacts: parsed.chosenBranch?.hypotheticalEvents || [],
            characterStatusUpdates: parsed.chosenBranch?.characterConsequences?.map(c => ({
              character: c.character,
              status: c.change,
            })) || [],
            continuityWarnings: parsed.chosenBranch?.continuityWarnings || [],
            timestamp: Date.now(),
          };

          setTurns([initialTurn]);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback: redirect to creator if no state
        navigate('/creator');
      }
    }
  }, [existingTimelineId]);

  // Submit next follow-up turn
  const handleAddTurn = async (e) => {
    if (e) e.preventDefault();
    if (!nextPrompt.trim() || isSubmittingTurn || !universeData) return;

    setIsSubmittingTurn(true);
    setError(null);

    try {
      const res = await api.continueTimeline({
        movieId: universeData.movieId,
        priorTurns: turns,
        chosenBranch: universeData.chosenBranch || { title: universeData.movieTitle },
        userFollowUp: nextPrompt.trim(),
      });

      if (res.success && res.data?.turn) {
        setTurns(prev => [...prev, res.data.turn]);
        setNextPrompt('');

        // If timeline is already saved in DB, append the turn to DB
        if (universeData.timelineId) {
          await api.appendTurnToTimeline(universeData.timelineId, res.data.turn);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to generate continuation.');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  // Save timeline to MongoDB
  const handleSaveTimeline = async () => {
    if (!universeData || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const guest = getGuestIdentity();

    try {
      const payload = {
        guestId: guest.guestId,
        movieId: universeData.movieId,
        customTitle: `${universeData.movieTitle}: ${universeData.chosenBranch?.title || 'Alternate Timeline'}`,
        initialScenario: universeData.initialScenario,
        initialBranches: universeData.branches || [],
        activeBranchId: branchId || 'branch-alpha',
        turns: turns,
        currentSummary: turns[turns.length - 1]?.narrativeText?.slice(0, 300) || '',
        isSaved: true,
        mode: 'solo',
      };

      const res = await api.saveTimeline(payload);
      if (res.success) {
        setSaveSuccess(true);
        setUniverseData(prev => ({ ...prev, timelineId: res.data.timelineId }));
      }
    } catch (err) {
      setError('Could not save timeline to database: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Undo last turn
  const handleUndoLastTurn = () => {
    if (turns.length <= 1) return;
    setTurns(prev => prev.slice(0, -1));
  };

  if (!universeData) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#30152F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full page-container-narrow py-10 space-y-8">
      
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[rgba(49,35,49,0.12)] gap-4 mb-8">
        <Link
          to={`/creator?movieId=${universeData.movieId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#654D63] hover:text-[#200F22] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Creator
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/creator?movieId=${universeData.movieId}`}>
            <Button variant="outline" size="sm" icon={GitBranch} className="uppercase tracking-wider text-xs font-mono">
              New Timeline
            </Button>
          </Link>

          {saveSuccess ? (
            <span className="text-xs font-mono text-[#287A59] flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-4 h-4" /> Universe Saved to MongoDB
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={Bookmark}
              isLoading={isSaving}
              onClick={handleSaveTimeline}
              className="uppercase tracking-wider text-xs font-mono"
            >
              Save Timeline
            </Button>
          )}

          <Link to="/saved">
            <Button variant="ghost" size="sm" className="uppercase tracking-wider text-xs font-mono">
              Saved Archive →
            </Button>
          </Link>
        </div>
      </div>

      {/* Universe Header Banner */}
      <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-start gap-6 shadow-sm">
        {universeData.posterUrl && (
          <img
            src={universeData.posterUrl}
            alt={universeData.movieTitle}
            className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl shadow-md border border-[rgba(49,35,49,0.15)] shrink-0"
          />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="multiverse" size="sm">ACTIVE REALITY</Badge>
            <span className="text-xs text-[#654D63] font-mono">{universeData.movieTitle}</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-[#200F22] leading-tight">
            {universeData.chosenBranch?.title || 'Alternate Timeline Story'}
          </h1>
          <p className="text-xs sm:text-sm text-[#654D63] italic bg-[#F2F1EE] p-3.5 rounded-xl border border-[rgba(49,35,49,0.12)]">
            Initial Divergence: "{universeData.initialScenario}"
          </p>
        </div>
      </div>

      {/* Chapters / Turns Progression */}
      <div className="space-y-8 relative pl-6 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#30152F]/40 via-[rgba(49,35,49,0.2)] to-transparent">
        
        {turns.map((turn, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-[30px] top-2 w-5 h-5 rounded-full bg-[#F2F1EE] border-2 border-[#30152F] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#30152F] font-mono">{turn.turnNumber}</span>
            </div>

            {/* Turn Card */}
            <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(49,35,49,0.12)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#30152F] uppercase tracking-wider">
                    Chapter {turn.turnNumber}
                  </span>
                  <span className="text-[#654D63]">•</span>
                  <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
                    {turn.continuationTitle || `Act ${turn.turnNumber}`}
                  </h3>
                </div>
                <span className="text-[11px] text-[#7E6C7D] font-mono uppercase tracking-wider">
                  {turn.contributedBy ? `By: ${turn.contributedBy}` : 'Solo Timeline'}
                </span>
              </div>

              {/* What-If Action Prompt */}
              {turn.userPrompt && (
                <div className="p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-xs text-[#30152F]">
                  <span className="font-semibold text-[#200F22]">Divergence Event:</span> "{turn.userPrompt}"
                </div>
              )}

              {/* Narrative Text */}
              <p className="text-sm text-[#30152F] leading-relaxed font-normal">
                {turn.narrativeText}
              </p>

              {/* Character State Updates */}
              {turn.characterStatusUpdates && turn.characterStatusUpdates.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-mono text-[#3C6E9E] font-semibold mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" /> Character State Evolutions:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {turn.characterStatusUpdates.map((c, i) => (
                      <div key={i} className="bg-[#F2F1EE] p-3 rounded-xl border border-[rgba(49,35,49,0.12)]">
                        <span className="font-semibold text-[#200F22]">{c.character}:</span>{' '}
                        <span className="text-[#654D63]">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canon Grounding Anchors */}
              {turn.canonFactsReferenced && turn.canonFactsReferenced.length > 0 && (
                <div className="text-[11px] text-[#287A59] font-mono pt-2">
                  ✓ Verified Lore Anchor: {turn.canonFactsReferenced[0]}
                </div>
              )}

              {/* Continuity Warnings */}
              {turn.continuityWarnings && turn.continuityWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-[#A83842]/10 border border-[#A83842]/25 text-xs text-[#A83842] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#A83842]" />
                  <span>{turn.continuityWarnings[0]}</span>
                </div>
              )}

            </div>
          </div>
        ))}

      </div>

      {/* Next Turn What-If Composer */}
      <div className="mt-12 editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial font-bold text-2xl text-[#200F22] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#30152F]" />
            Continue the Alternate Universe (Chapter {turns.length + 1})
          </h3>

          {turns.length > 1 && (
            <button
              onClick={handleUndoLastTurn}
              className="text-xs text-[#7E6C7D] hover:text-[#A83842] transition-colors font-mono uppercase tracking-wider"
            >
              Undo Last Turn
            </button>
          )}
        </div>

        <form onSubmit={handleAddTurn} className="space-y-4">
          <textarea
            rows={3}
            value={nextPrompt}
            onChange={(e) => setNextPrompt(e.target.value)}
            placeholder={`What happens next? Propose a new decision, unexpected ambush, or moral dilemma (e.g. "What if the police discover the secret hideout before dawn?")...`}
            className="w-full p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30 leading-relaxed font-normal"
            required
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-[#7E6C7D] font-mono">
              The continuity engine evaluates earlier chapter states before weaving the turn.
            </span>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmittingTurn}
              icon={Send}
              className="uppercase tracking-wider text-xs font-semibold px-6 shadow-sm"
            >
              Weave Next Chapter
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
};
