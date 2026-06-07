'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import {
  Loader2,
  Pencil,
  Wallet,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Coins,
  X,
  Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/StarRating';
import { TxHudOverlay } from '@/components/TxHudOverlay';
import { JobCard } from '@/components/JobCard';
import {
  useGetProfile,
  useSetProfile,
  useGetAllJobs,
} from '@/hooks/useArbiqContract';
import { truncateAddress, formatBudget } from '@/lib/utils';

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: routeAddress } = use(params);
  const { address: connected } = useAccount();

  const { data: profile, isLoading, refetch } = useGetProfile(routeAddress);
  const { data: allJobs = [] } = useGetAllJobs();

  const isOwnProfile = !!connected && connected.toLowerCase() === routeAddress.toLowerCase();
  const [editing, setEditing] = useState(false);

  // Jobs this address worked as freelancer + posted as client
  const { workedJobs, postedJobs } = useMemo(() => {
    const lower = routeAddress.toLowerCase();
    return {
      workedJobs: allJobs.filter((j) => j.freelancer?.toLowerCase() === lower),
      postedJobs: allJobs.filter((j) => j.client?.toLowerCase() === lower),
    };
  }, [allJobs, routeAddress]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <main className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#a78bfa' }} />
        </main>
      </div>
    );
  }

  const score = profile?.reputation_score ?? 100;
  const repColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8 px-4 md:px-8 relative overflow-hidden" style={{ borderBottom: '1px solid var(--border-page)' }}>
        <div className="orb orb-violet absolute w-96 h-96 -top-20 -right-20 opacity-20" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Avatar — gradient identicon-ish */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${parseInt(routeAddress.slice(2, 8), 16) % 360},70%,55%), #7c3aed)`,
                  boxShadow: '0 0 24px rgba(124,58,237,0.3)',
                }}
              >
                {(profile?.display_name || routeAddress.slice(2, 3)).slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {profile?.display_name || 'Anonymous Freelancer'}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                  <Wallet className="w-3.5 h-3.5" />
                  {truncateAddress(routeAddress, 6)}
                </div>
                {(profile?.rating_count ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={profile?.avg_rating ?? 0} showValue size={16} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ({profile?.rating_count} rating{profile?.rating_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 md:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {editing ? (
            <ProfileEditor
              initial={{
                display_name: profile?.display_name ?? '',
                bio: profile?.bio ?? '',
                skills: profile?.skills ?? [],
              }}
              onDone={() => { setEditing(false); refetch(); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {/* Bio */}
              {profile?.bio && (
                <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-label)' }}>About</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {(profile?.skills?.length ?? 0) > 0 && (
                <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-label)' }}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile!.skills.map((s) => (
                      <span key={s} className="pill" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={<span style={{ color: repColor }}>★</span>} label="Reputation" value={`${score}%`} color={repColor} />
                <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={String(profile?.jobs_completed ?? 0)} color="#22c55e" />
                <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Disputed" value={String(profile?.jobs_disputed ?? 0)} color="#ef4444" />
                <StatCard icon={<Coins className="w-4 h-4" />} label="Earned" value={formatBudget(profile?.total_earned ?? 0)} color="#a78bfa" />
              </div>

              {/* Worked jobs */}
              <JobList title="Work History" icon={<Briefcase className="w-4 h-4" />} jobs={workedJobs} empty="No completed work yet." />

              {/* Posted jobs */}
              {postedJobs.length > 0 && (
                <JobList title="Jobs Posted" icon={<Plus className="w-4 h-4" />} jobs={postedJobs} empty="" />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-2xl space-y-1.5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-label-dim)' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <p className="text-lg font-black font-mono" style={{ color }}>{value}</p>
    </div>
  );
}

function JobList({ title, icon, jobs, empty }: { title: string; icon: React.ReactNode; jobs: import('@/lib/types').Job[]; empty: string }) {
  if (jobs.length === 0 && !empty) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-label)' }}>
        {icon} {title} <span style={{ color: 'var(--text-muted)' }}>({jobs.length})</span>
      </h2>
      {jobs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{empty}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}

function ProfileEditor({
  initial,
  onDone,
  onCancel,
}: {
  initial: { display_name: string; bio: string; skills: string[] };
  onDone: () => void;
  onCancel: () => void;
}) {
  const { setProfile, txState, isLoading } = useSetProfile();
  const [name, setName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (txState.status === 'error' && txState.error) toast.error(txState.error);
    if (txState.status === 'finalized') {
      toast.success('Profile saved!');
      onDone();
    }
  }, [txState.status, txState.error, onDone]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.length >= 20) { toast.error('Maximum 20 skills'); return; }
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) { setSkillInput(''); return; }
    setSkills([...skills, s.slice(0, 30)]);
    setSkillInput('');
  };

  return (
    <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>Display name</label>
        <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada Lovelace" disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>Bio</label>
        <Textarea rows={4} value={bio} maxLength={500} onChange={(e) => setBio(e.target.value)} placeholder="Tell clients about your experience and specialties…" disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>Skills <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({skills.length}/20)</span></label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Add a skill and press Enter"
            disabled={isLoading}
          />
          <button onClick={addSkill} disabled={isLoading} className="px-3 rounded-xl shrink-0" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((s) => (
              <span key={s} className="pill inline-flex items-center gap-1" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
                {s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))} disabled={isLoading} style={{ lineHeight: 0 }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setProfile(name.trim(), bio.trim(), skills)}
          disabled={isLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Profile'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
      </div>

      <TxHudOverlay
        status={txState.status}
        consensusStatus={txState.consensusStatus}
        txHash={txState.txHash}
        error={txState.error}
        operation="set_profile"
      />
    </div>
  );
}
