'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PostJobFAB } from '@/components/PostJobFAB';
import { JobCard, JobCardSkeleton } from '@/components/JobCard';
import { JobFilterBar, JobFilterSidebar } from '@/components/JobFilters';
import { useJobs, DEFAULT_FILTERS } from '@/hooks/useJobs';
import { useLocalFavorites } from '@/hooks/useLocalFavorites';
import type { JobFilters } from '@/hooks/useJobs';
import Link from 'next/link';
import { Heart, PlusCircle, RefreshCw } from 'lucide-react';

export default function BrowseJobsPage() {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [showFavs, setShowFavs] = useState(false);

  const { allJobs, filteredJobs, isLoading, error, refetch, budgetCeiling, statusCounts } =
    useJobs(filters);
  const { isFavorite, favorites } = useLocalFavorites();

  const patchFilters = useCallback((patch: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const visibleJobs = showFavs
    ? filteredJobs.filter((j) => isFavorite(j.id))
    : filteredJobs;

  const filterProps = {
    filters,
    onChange: patchFilters,
    onClear: clearFilters,
    budgetCeiling,
    statusCounts,
    totalCount: allJobs.length,
    filteredCount: visibleJobs.length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--border-page)' }}
      >
        <div className="orb orb-violet absolute w-96 h-96 -top-32 right-0 opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="label mb-2" style={{ color: '#7c3aed' }}>
                Open Marketplace
              </p>
              <h1
                className="font-display text-5xl"
                style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}
              >
                FIND WORK
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} live on-chain — pick one up, deliver the work, get paid automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Favorites toggle */}
              <button
                onClick={() => setShowFavs((v) => !v)}
                className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: showFavs ? 'rgba(239,68,68,0.12)' : 'var(--surface-raised)',
                  border: `1px solid ${showFavs ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                  color: showFavs ? '#f87171' : 'var(--text-secondary)',
                }}
              >
                <Heart className="w-3.5 h-3.5" fill={showFavs ? 'currentColor' : 'none'} />
                Saved
                {favorites.size > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: showFavs ? 'rgba(239,68,68,0.2)' : 'var(--surface-raised)',
                      color: showFavs ? '#f87171' : 'var(--text-muted)',
                      border: `1px solid ${showFavs ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {favorites.size}
                  </span>
                )}
              </button>

              <Link
                href="/jobs/new"
                className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        {/* Search bar + sort + result count (full width, above the two-column layout) */}
        <JobFilterBar {...filterProps} />

        {/* Two-column: sidebar (desktop) | job grid */}
        <div className="flex gap-6 items-start">
          {/* Sticky filter sidebar — hidden on mobile, rendered by JobFilterSidebar */}
          <JobFilterSidebar
            filters={filters}
            onChange={patchFilters}
            onClear={clearFilters}
            budgetCeiling={budgetCeiling}
            statusCounts={statusCounts}
          />

          {/* Job grid */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div
                className="text-center py-28 rounded-2xl"
                style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <p className="font-semibold mb-2" style={{ color: '#f87171' }}>
                  Failed to load jobs
                </p>
                <p
                  className="text-sm font-mono mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {error}
                </p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.28)',
                    color: '#a78bfa',
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : visibleJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
                {visibleJobs.map((job, i) => (
                  <div
                    key={job.id}
                    className="anim-fade-up"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-28 rounded-2xl"
                style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {showFavs ? (
                  <>
                    <Heart
                      className="w-8 h-8 mx-auto mb-4 opacity-20"
                      style={{ color: '#f87171' }}
                    />
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      No saved jobs
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Click the heart on any job card to save it here.
                    </p>
                  </>
                ) : allJobs.length === 0 ? (
                  <>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      The marketplace is empty
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Be the first to post work — someone will pick it up.
                    </p>
                    <Link
                      href="/jobs/new"
                      className="inline-block text-sm font-bold transition-colors"
                      style={{ color: '#7c3aed' }}
                    >
                      Post the first job →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Nothing matches those filters
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Widen the budget range, change the status, or clear everything.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-sm font-bold transition-colors"
                      style={{ color: '#7c3aed' }}
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <PostJobFAB />
    </div>
  );
}
