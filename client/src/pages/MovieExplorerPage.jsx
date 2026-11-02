import React, { useState, useEffect } from 'react';
import { Search, Film } from 'lucide-react';
import { MovieCard } from '../components/movies/MovieCard';
import { api } from '../services/api';

export const MovieExplorerPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [error, setError] = useState(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedLanguage !== 'all') params.language = selectedLanguage;
      if (selectedGenre !== 'all') params.genre = selectedGenre;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.getMovies(params);
      setMovies(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMovies();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedLanguage, selectedGenre]);

  const genres = ['Action', 'Crime', 'Drama', 'Sci-Fi', 'Thriller', 'Comedy'];

  return (
    <div className="w-full page-container py-10 sm:py-12 space-y-10">
      
      {/* Editorial Header */}
      <div className="mb-12 pb-8 border-b border-[rgba(49,35,49,0.12)]">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#654D63] uppercase tracking-[0.25em] mb-3">
          <Film className="w-3.5 h-3.5" /> Canon Screenplay Knowledge Base
        </div>
        <h1 className="font-editorial text-4xl sm:text-6xl font-bold text-[#200F22] tracking-tight mb-4">
          Movie Explorer
        </h1>
        <p className="text-sm sm:text-base text-[#654D63] max-w-2xl leading-relaxed">
          Browse verified cinematic universes from Tamil cinema and global classics. Every film includes rich plot breakdowns, character relationships, and turning points.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="editorial-card bg-[#E8E6E2] p-5 sm:p-6 rounded-2xl mb-12 space-y-4 shadow-sm">
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E6C7D]" />
            <input
              type="text"
              placeholder="Search by title, director, or actor (e.g. Vikram, Nolan, Kamal Haasan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30"
            />
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all ${
                selectedLanguage === 'all'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
              }`}
            >
              All Languages
            </button>
            <button
              onClick={() => setSelectedLanguage('ta')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all ${
                selectedLanguage === 'ta'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
              }`}
            >
              Tamil (தமிழ்)
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all ${
                selectedLanguage === 'en'
                  ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm'
                  : 'bg-[#F2F1EE] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.12)]'
              }`}
            >
              English Classics
            </button>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[rgba(49,35,49,0.12)] text-xs">
          <span className="text-[#7E6C7D] font-mono text-[10px] tracking-widest uppercase mr-1">Genre:</span>
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
              selectedGenre === 'all'
                ? 'bg-[#30152F] text-[#F2F1EE]'
                : 'text-[#654D63] hover:text-[#200F22]'
            }`}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
              className={`px-3 py-1 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors ${
                selectedGenre === genre
                  ? 'bg-[#30152F] text-[#F2F1EE] border-[#30152F]'
                  : 'bg-[#F2F1EE] text-[#654D63] border-[rgba(49,35,49,0.12)] hover:text-[#200F22]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

      </div>

      {/* Movies Grid / State Views */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-[#E8E6E2] animate-pulse border border-[rgba(49,35,49,0.12)]" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-[#A83842]/10 border border-[#A83842]/25 rounded-2xl max-w-lg mx-auto">
          <p className="text-[#A83842] font-semibold mb-2">Error connecting to movie library</p>
          <p className="text-xs text-[#654D63] mb-4">{error}</p>
          <button
            onClick={fetchMovies}
            className="px-4 py-2 bg-[#30152F] hover:bg-[#200F22] text-[#F2F1EE] text-xs font-semibold rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-16 text-center editorial-card bg-[#E8E6E2] rounded-2xl max-w-lg mx-auto space-y-3">
          <Film className="w-10 h-10 text-[#7E6C7D] mx-auto" />
          <h3 className="font-editorial font-bold text-2xl text-[#200F22]">No movies match your filter</h3>
          <p className="text-xs text-[#654D63]">
            Try adjusting your search query or selecting a different language/genre.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedLanguage('all'); setSelectedGenre('all'); }}
            className="px-5 py-2.5 bg-[#30152F] text-[#F2F1EE] font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-[#200F22]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.movieId} movie={movie} />
          ))}
        </div>
      )}

    </div>
  );
};
