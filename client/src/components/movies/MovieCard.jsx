import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, ShieldCheck, Calendar, Globe } from 'lucide-react';
import { Badge } from '../common/Badge';

export const MovieCard = ({ movie }) => {
  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  const poster = movie.posterUrl || fallbackPoster;

  return (
    <div className="group relative bg-[#E8E6E2] rounded-2xl overflow-hidden border border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.3)] transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-[#30152F]/8 min-w-0">
      
      {/* Poster Media with Dark Film Gradient Overlay */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#D5D2CD]">
        <img
          src={poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter contrast-[1.03]"
          loading="lazy"
          onError={(e) => { e.target.src = fallbackPoster; }}
        />
        
        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#200F22]/90 via-[#200F22]/20 to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <Badge variant={movie.language === 'ta' ? 'multiverse' : 'neutral'} size="sm">
            <Globe className="w-3 h-3" />
            {movie.languageLabel || 'Cinema'}
          </Badge>

          {movie.dataStatus === 'verified' && (
            <Badge variant="canon" size="sm">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-[#200F22]/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 gap-2.5">
          <Link
            to={`/creator?movieId=${movie.movieId}`}
            className="w-full py-2.5 px-4 bg-[#F2F1EE] hover:bg-[#FFFFFF] text-[#200F22] font-semibold text-xs tracking-wider uppercase rounded-xl text-center shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Forge What If
          </Link>
          <Link
            to={`/movies/${movie.movieId}`}
            className="w-full py-2 px-4 bg-[#30152F] hover:bg-[#3E1C3D] text-[#F2F1EE] text-xs tracking-wider uppercase rounded-xl text-center border border-[rgba(242,241,238,0.2)] transition-colors"
          >
            Inspect Canon
          </Link>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#7E6C7D] mb-1.5">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-[#654D63]" />
              {movie.releaseYear}
            </span>
            {movie.director && (
              <>
                <span className="text-[rgba(49,35,49,0.25)]">•</span>
                <span className="truncate">{movie.director}</span>
              </>
            )}
          </div>

          <Link to={`/movies/${movie.movieId}`}>
            <h3 className="font-editorial font-bold text-xl text-[#200F22] group-hover:text-[#30152F] transition-colors line-clamp-1 leading-snug">
              {movie.title}
            </h3>
          </Link>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="text-[11px] text-[#7E6C7D] font-mono mb-2">{movie.originalTitle}</p>
          )}

          <p className="text-xs text-[#654D63] line-clamp-2 mt-1 leading-relaxed">
            {movie.overview}
          </p>
        </div>

        {/* Card Footer: Genres & Chunk Count */}
        <div className="mt-4 pt-3 border-t border-[rgba(49,35,49,0.12)] flex items-center justify-between text-[11px] text-[#7E6C7D]">
          <span className="truncate max-w-[150px] font-mono uppercase tracking-wider">
            {movie.genres?.slice(0, 2).join(' • ') || 'Drama'}
          </span>
          <span className="font-mono text-[#30152F] font-semibold">
            {movie.chunkCount || 6} canon chunks
          </span>
        </div>

      </div>
    </div>
  );
};
