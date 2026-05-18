'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { JobCard, JobCardSkeleton } from '@/components/JobCard';
import { useGetAllJobs } from '@/hooks/useArbiqContract';
import { JobStatus } from '@/lib/types';
import Link from 'next/link';
import { PlusCircle, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = jobs
    .filter((j) => filter === 'all' || j.status === filter)
    .filter(
      (j) =>
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase()),
    )
    .slice()
    .reverse();

  const counts: Record<string, number> = { all: jobs.length };
  jobs.forEach((j) => {
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
              <h1 className="headline" style={{ color: 'var(--text-primary)' }}>Browse Jobs</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
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
        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: '#5a5a7a' }}
            />
            <input
              type="text"
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11 pr-4"
              style={{ borderRadius: '12px' }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors sm:w-auto"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
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
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No jobs found</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {filter !== 'all' ? 'Try a different filter' : 'Be the first to post a job!'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
