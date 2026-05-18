'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { JobCard, JobCardSkeleton } from '@/components/JobCard';
import { useGetAllJobs } from '@/hooks/useArbiqContract';
import { useLocalFavorites } from '@/hooks/useLocalFavorites';
import { JobStatus } from '@/lib/types';
import Link from 'next/link';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Clock, Heart, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/Footer';
import { PostJobFAB } from '@/components/PostJobFAB';

type SortKey = 'newest' | 'budget-desc' | 'budget-asc' | 'deadline';

const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'newest',      label: 'Newest',        icon: <Clock className="w-3 h-3" /> },
  { key: 'budget-desc', label: 'Budget: High',  icon: <TrendingDown className="w-3 h-3" /> },
  { key: 'budget-asc',  label: 'Budget: Low',   icon: <TrendingUp className="w-3 h-3" /> },
  { key: 'deadline',    label: 'Deadline Soon',  icon: <Clock className="w-3 h-3" /> },
];

const FILTERS: { label: string; value: JobStatus | 'all'; dot?: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open', dot: '#38bdf8' },
  { label: 'Active', value: 'active', dot: '#f59e0b' },
  { label: 'Delivered', value: 'delivered', dot: '#fb923c' },
  { label: 'Completed', value: 'completed', dot: '#22c55e' },
  { label: 'Disputed', value: 'disputed', dot: '#ef4444' },
];

export default function BrowseJobsPage() {
  const { data: jobs = [], isLoading, error } = useGetAllJobs();
  const { isFavorite, favorites } = useLocalFavorites();
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [showFavs, setShowFavs] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState<SortKey>('newest');
  const [showSort, setShowSort] = useState(false);

  const base = showFavs ? jobs.filter((j) => isFavorite(j.id)) : jobs;

  const filtered = base
    .filter((j) => filter === 'all' || j.status === filter)
    .filter(
      (j) =>
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase()),
    )
    .slice()
    .sort((a, b) => {
      if (sort === 'newest')      return b.id - a.id;
      if (sort === 'budget-desc') return b.budget - a.budget;
      if (sort === 'budget-asc')  return a.budget - b.budget;
      if (sort === 'deadline')    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  const counts: Record<string, number> = { all: base.length };
  base.forEach((j) => {
    counts[j.status] = (counts[j.status] ?? 0) + 1;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--border-page)' }}
      >
        <div className="orb orb-violet absolute w-96 h-96 -top-32 right-0 opacity-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="label mb-2" style={{ color: '#7c3aed' }}>
                Marketplace
              </p>
              <h1 className="font-display text-5xl" style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                BROWSE JOBS
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted on-chain
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="btn-primary self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      <main className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
        {/* Search + filter bar — single row at all breakpoints */}
        <div className="flex items-center gap-2 mb-6 w-full">
          {/* Search input — takes all remaining space, buttons never overlap */}
          <div className="relative" style={{ flex: '1 1 0', minWidth: 0 }}>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#5a5a7a' }}
            />
            <input
              type="text"
              placeholder="Search jobs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                minWidth: 0,
                height: '44px',
                paddingLeft: '2.75rem',
                paddingRight: '1rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontFamily: '"Darker Grotesque", system-ui, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Saved + Sort — never shrink, always right of search */}
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            {/* Saved toggle */}
            <button
              onClick={() => setShowFavs((v) => !v)}
              className="flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: showFavs ? 'rgba(239,68,68,0.12)' : 'var(--surface-raised)',
                border: `1px solid ${showFavs ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                color: showFavs ? '#f87171' : 'var(--text-secondary)',
              }}
            >
              <Heart className="w-3.5 h-3.5 flex-shrink-0" fill={showFavs ? 'currentColor' : 'none'} />
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

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort((v) => !v)}
                className="flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                style={{
                  background: showSort ? 'rgba(124,58,237,0.15)' : 'var(--surface-raised)',
                  border: `1px solid ${showSort ? 'rgba(124,58,237,0.35)' : 'var(--border-subtle)'}`,
                  color: showSort ? '#c4b5fd' : 'var(--text-secondary)',
                }}
              >
                <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
                {SORTS.find((s) => s.key === sort)?.label ?? 'Sort'}
              </button>
            {showSort && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-20 anim-scale-in"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-mid)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                }}
              >
                {SORTS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setShowSort(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                    style={{
                      color: sort === key ? '#a78bfa' : 'var(--text-secondary)',
                      background: sort === key ? 'rgba(124,58,237,0.1)' : 'transparent',
                      fontWeight: sort === key ? 600 : 400,
                    }}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Status tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-8 flex-wrap"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {FILTERS.map(({ label, value, dot }) => {
            const active = filter === value;
            const count = counts[value] ?? 0;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  active ? '' : '',
                )}
                style={
                  active
                    ? {
                        background: 'rgba(124,58,237,0.2)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        color: 'var(--violet-300)',
                      }
                    : { color: 'var(--text-muted)' }
                }
              >
                {dot && active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: dot }}
                  />
                )}
                {label}
                {count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: active ? 'rgba(255,255,255,0.15)' : 'var(--surface-raised)',
                      color: active ? 'var(--violet-300)' : 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {!isLoading && !error && (
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {filtered.length > 0
              ? `SHOWING ${filtered.length} JOB${filtered.length !== 1 ? 'S' : ''}${showFavs ? ' · SAVED' : ''}`
              : ''}
          </p>
        )}

        {/* Job grid */}
        {error ? (
          <div
            className="text-center py-28 rounded-2xl"
            style={{ background: 'var(--surface-subtle)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <p className="font-semibold mb-2" style={{ color: '#f87171' }}>Failed to load jobs</p>
            <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {filtered.map((job, i) => (
              <div key={job.id} className="anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
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
                <Heart className="w-8 h-8 mx-auto mb-4 opacity-20" style={{ color: '#f87171' }} />
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No saved jobs</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Click the heart on any job card to save it here.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No jobs found</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {filter !== 'all' ? 'Try a different filter or clear search.' : 'Be the first to post a job!'}
                </p>
                {filter === 'all' && !search && (
                  <a
                    href="/jobs/new"
                    className="inline-block mt-4 text-sm font-bold transition-colors"
                    style={{ color: '#7c3aed' }}
                  >
                    Post a job →
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
      <PostJobFAB />
    </div>
  );
}
