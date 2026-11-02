import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  GitBranch,
  Trash2,
  Edit3,
  Play,
  Calendar,
  Film,
  Search,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  Clock
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { getGuestIdentity } from '../services/guestIdentity';

export const SavedTimelinesPage = () => {
  const navigate = useNavigate();
  const [guest] = useState(getGuestIdentity());
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'solo' | 'coop'

  // Rename state
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, timelineId: null, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTimelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSavedTimelines(guest.guestId);
      setTimelines(res.data || []);
    } catch (err) {
      console.error('Failed to load saved timelines:', err);
      setError(err.message || 'Unable to retrieve saved universes from the archive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, [guest.guestId]);

  const handleStartRename = (timeline) => {
    setRenamingId(timeline.timelineId);
    setNewTitle(timeline.customTitle || '');
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setNewTitle('');
  };

  const handleSaveRename = async (timelineId) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setIsRenaming(true);
    try {
      await api.updateTimeline(timelineId, { customTitle: trimmed });
      setTimelines(prev =>
        prev.map(t => (t.timelineId === timelineId ? { ...t, customTitle: trimmed } : t))
      );
      setRenamingId(null);
      setNewTitle('');
      showToast('Universe title updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to rename timeline.', 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeletePrompt = (timeline) => {
    setDeleteModal({
      isOpen: true,
      timelineId: timeline.timelineId,
      title: timeline.customTitle || timeline.movieTitle || 'Alternate Timeline',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.timelineId) return;
    setIsDeleting(true);
    try {
      await api.deleteTimeline(deleteModal.timelineId);
      setTimelines(prev => prev.filter(t => t.timelineId !== deleteModal.timelineId));
      showToast('Timeline removed from your universe archive.');
      setDeleteModal({ isOpen: false, timelineId: null, title: '' });
    } catch (err) {
      showToast(err.message || 'Failed to delete timeline.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered timelines
  const filteredTimelines = useMemo(() => {
    return timelines.filter(t => {
      // Filter by mode
      if (activeFilter === 'solo' && t.mode === 'coop') return false;
      if (activeFilter === 'coop' && t.mode !== 'coop') return false;

      // Filter by search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (t.customTitle || '').toLowerCase().includes(q);
        const movieMatch = (t.movieTitle || '').toLowerCase().includes(q);
        const scenarioMatch = (t.initialScenario || '').toLowerCase().includes(q);
        const summaryMatch = (t.currentSummary || '').toLowerCase().includes(q);
        return titleMatch || movieMatch || scenarioMatch || summaryMatch;
      }
      return true;
    });
  }, [timelines, activeFilter, searchQuery]);

  const soloCount = useMemo(() => timelines.filter(t => t.mode !== 'coop').length, [timelines]);
  const coopCount = useMemo(() => timelines.filter(t => t.mode === 'coop').length, [timelines]);

  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="w-full page-container py-10 sm:py-12 relative flex flex-col space-y-8">
      
      {/* Subtle Vertical Grid Lines Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 -z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(49, 35, 49, 0.08) 0px, rgba(49, 35, 49, 0.08) 1px, transparent 1px, transparent 140px)',
        }}
      />

      <div className="relative z-10 space-y-8">

        {/* Top Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono uppercase tracking-[0.22em] text-[#654D63] pb-4 border-b border-[rgba(49,35,49,0.12)]">
          <span className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-[#30152F]" />
            PERSISTENT MULTIVERSE ARCHIVE • VOL. II
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[#7E6C7D]">
              STORAGE: MONGODB CLUSTER
            </span>
            <Link
              to="/settings"
              className="hover:text-[#200F22] underline underline-offset-4 decoration-[rgba(49,35,49,0.3)] transition-colors"
            >
              ARCHIVE ID: {guest.name}
            </Link>
          </div>
        </div>

        {/* Main Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(49,35,49,0.12)]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E6E2] border border-[rgba(49,35,49,0.15)] text-[11px] font-mono tracking-widest uppercase text-[#30152F] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#30152F]" />
              <span>Alternate Reality Vault</span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-6xl font-bold text-[#200F22] tracking-tight mb-3">
              Saved Universes
            </h1>
            <p className="text-sm sm:text-base text-[#654D63] leading-relaxed">
              Revisit, continue, and curate your branched realities. Every saved timeline is durably stored in MongoDB with verified canon references, character state shifts, and multi-turn narratives.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              isLoading={loading}
              onClick={fetchTimelines}
              title="Refresh saved universes"
            >
              Refresh
            </Button>
            <Link to="/creator">
              <Button variant="primary" size="md" icon={GitBranch}>
                Forge New Universe
              </Button>
            </Link>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between transition-all animate-fadeIn ${
              toast.type === 'error'
                ? 'bg-[#A83842]/10 border border-[#A83842]/30 text-[#A83842]'
                : 'bg-[#287A59]/10 border border-[#287A59]/30 text-[#287A59]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error State Banner */}
        {error && (
          <div className="editorial-card bg-[#A83842]/10 border border-[#A83842]/30 rounded-2xl p-5 text-[#A83842] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTimelines} className="shrink-0 text-[#A83842] border-[#A83842]/40 hover:bg-[#A83842]/10">
              Try Again
            </Button>
          </div>
        )}

        {/* Search & Mode Filters Toolbar */}
        {!loading && timelines.length > 0 && (
          <div className="editorial-card bg-[#E8E6E2] p-4 sm:p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E6C7D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by timeline title, movie, or What-If prompt..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.15)] text-xs text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6C7D] hover:text-[#200F22]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                    : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
                }`}
              >
                All Universes ({timelines.length})
              </button>

              <button
                onClick={() => setActiveFilter('solo')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                  activeFilter === 'solo'
                    ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                    : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
                }`}
              >
                Solo Realities ({soloCount})
              </button>

              <button
                onClick={() => setActiveFilter('coop')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                  activeFilter === 'coop'
                    ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                    : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
                }`}
              >
                Co-op Multiverse ({coopCount})
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          /* High-Fidelity Editorial Skeleton Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#E8E6E2] rounded-2xl p-6 border border-[rgba(49,35,49,0.12)] animate-pulse space-y-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-24 bg-[#DDD9D4] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-20 h-4 bg-[#DDD9D4] rounded-md" />
                    <div className="w-full h-6 bg-[#DDD9D4] rounded-md" />
                    <div className="w-24 h-3 bg-[#DDD9D4] rounded-md" />
                  </div>
                </div>
                <div className="w-full h-14 bg-[#DDD9D4] rounded-xl" />
                <div className="w-full h-8 bg-[#DDD9D4] rounded-xl" />
                <div className="pt-4 border-t border-[rgba(49,35,49,0.1)] flex justify-between items-center">
                  <div className="w-24 h-4 bg-[#DDD9D4] rounded-md" />
                  <div className="w-28 h-8 bg-[#DDD9D4] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : timelines.length === 0 ? (
          /* Empty State: No Timelines Saved */
          <div className="editorial-card bg-[#E8E6E2] rounded-3xl p-10 sm:p-16 text-center border border-[rgba(49,35,49,0.14)] max-w-xl mx-auto space-y-6 shadow-sm my-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] flex items-center justify-center mx-auto text-[#30152F] shadow-sm">
              <Bookmark className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#200F22]">
                No Universes Recorded Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#654D63] max-w-md mx-auto leading-relaxed">
                Every critical choice sparks a divergent reality. Explore canon films in the What-If Simulator, select a divergence point, and preserve your timeline here to continue the multi-turn story at any time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/creator">
                <Button variant="primary" size="md" icon={GitBranch}>
                  Forge Your First Timeline
                </Button>
              </Link>
              <Link to="/movies">
                <Button variant="outline" size="md" icon={Film}>
                  Browse Canon Screenplays
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredTimelines.length === 0 ? (
          /* Empty Search Filter State */
          <div className="editorial-card bg-[#E8E6E2] rounded-3xl p-10 text-center border border-[rgba(49,35,49,0.12)] max-w-md mx-auto space-y-4 my-8">
            <Search className="w-8 h-8 text-[#7E6C7D] mx-auto" />
            <h4 className="font-editorial text-xl font-bold text-[#200F22]">No Matching Universes</h4>
            <p className="text-xs text-[#654D63]">
              No saved timelines match your search query "{searchQuery}".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Universes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTimelines.map((timeline) => {
              const isEditingThis = renamingId === timeline.timelineId;
              const poster = timeline.posterUrl || fallbackPoster;
              const createdDate = timeline.createdAt
                ? new Date(timeline.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Archived';
              const chapterCount = timeline.turns?.length || 1;

              return (
                <div
                  key={timeline.timelineId}
                  className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 border border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.3)] hover:shadow-editorial transition-all duration-300 flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-4">
                    
                    {/* Top Poster + Badges + Actions Strip */}
                    <div className="flex items-start gap-4">
                      {/* Movie Poster Artwork */}
                      <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-[#DDD9D4] border border-[rgba(49,35,49,0.16)] shadow-sm">
                        <img
                          src={poster}
                          alt={timeline.movieTitle || 'Film'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter contrast-[1.02]"
                          onError={(e) => {
                            e.target.src = fallbackPoster;
                          }}
                        />
                      </div>

                      {/* Info & Action Buttons */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <Badge
                            variant={timeline.mode === 'coop' ? 'canon' : 'multiverse'}
                            size="sm"
                          >
                            {timeline.mode === 'coop' ? 'Co-op Multiverse' : 'Solo Alternate'}
                          </Badge>

                          {/* Action Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartRename(timeline)}
                              className="p-1.5 rounded-lg text-[#654D63] hover:text-[#200F22] hover:bg-[#F2F1EE] border border-transparent hover:border-[rgba(49,35,49,0.12)] transition-colors"
                              title="Rename timeline"
                              aria-label="Rename universe"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrompt(timeline)}
                              className="p-1.5 rounded-lg text-[#654D63] hover:text-[#A83842] hover:bg-[#A83842]/10 border border-transparent hover:border-[#A83842]/20 transition-colors"
                              title="Delete timeline"
                              aria-label="Delete universe"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Movie Title */}
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#654D63] tracking-wide uppercase line-clamp-1">
                          <Film className="w-3 h-3 shrink-0 text-[#7E6C7D]" />
                          <span className="truncate">{timeline.movieTitle || 'Screenplay'}</span>
                        </div>

                        {/* Date metadata */}
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#7E6C7D] mt-1">
                          <Calendar className="w-3 h-3 shrink-0 text-[#7E6C7D]" />
                          <span>{createdDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Title or Rename Input */}
                    <div>
                      {isEditingThis ? (
                        <div className="space-y-2 pt-1 animate-fadeIn">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-[#654D63] block">
                            Rename Universe Title
                          </label>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(timeline.timelineId);
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            autoFocus
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.22)] text-[#200F22] font-semibold focus:outline-none focus:ring-2 focus:ring-[#30152F]/30"
                            placeholder="Enter custom universe title..."
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={isRenaming}
                              onClick={() => handleSaveRename(timeline.timelineId)}
                            >
                              Save Title
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isRenaming}
                              onClick={handleCancelRename}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#200F22] group-hover:text-[#30152F] transition-colors line-clamp-2 leading-snug">
                          {timeline.customTitle || `${timeline.movieTitle}: What If Divergence`}
                        </h3>
                      )}
                    </div>

                    {/* What-If Initial Dilemma */}
                    <div className="bg-[#F2F1EE] p-3.5 rounded-xl border border-[rgba(49,35,49,0.1)] text-xs text-[#30152F] leading-relaxed">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#7E6C7D] block mb-1">
                        Divergence Point
                      </span>
                      <p className="italic line-clamp-2">
                        "{timeline.initialScenario}"
                      </p>
                    </div>

                    {/* Current Summary if available */}
                    {timeline.currentSummary && (
                      <p className="text-xs text-[#654D63] line-clamp-3 leading-relaxed">
                        {timeline.currentSummary}
                      </p>
                    )}

                  </div>

                  {/* Card Footer: Metadata & Resume Button */}
                  <div className="pt-4 mt-5 border-t border-[rgba(49,35,49,0.12)] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#7E6C7D] font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#654D63]" />
                      <span>{chapterCount} {chapterCount === 1 ? 'Chapter' : 'Chapters'}</span>
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => navigate(`/timeline/story?timelineId=${timeline.timelineId}`)}
                      className="shadow-sm group-hover:shadow transition-shadow"
                    >
                      Resume Universe →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-[#200F22]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="editorial-card bg-[#F2F1EE] rounded-3xl p-6 sm:p-8 border border-[rgba(49,35,49,0.2)] max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#A83842]/10 border border-[#A83842]/20 flex items-center justify-center text-[#A83842] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[#200F22]">
                  Delete Universe?
                </h3>
                <p className="text-xs font-mono text-[#7E6C7D] uppercase tracking-wider">
                  Permanent Archive Action
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#200F22]">"{deleteModal.title}"</strong> from your saved multiverse in MongoDB? All chapter continuations, character states, and canon records will be lost.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(49,35,49,0.12)]">
              <Button
                variant="outline"
                size="md"
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, timelineId: null, title: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                isLoading={isDeleting}
                icon={Trash2}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SavedTimelinesPage;
