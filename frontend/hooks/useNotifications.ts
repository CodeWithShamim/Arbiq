"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import type { Job } from "@/lib/types";
import { readContract } from "@/lib/genlayer/client";

export type NotificationType = "approved" | "disputed" | "delivered" | "taken" | "stale";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  jobId: number;
  jobTitle: string;
  createdAt: number; // unix ms
  read: boolean;
}

const STORAGE_KEY = "arbiq:notifications";

function loadStored(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveStored(notifs: AppNotification[]) {
  try {
    // keep latest 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(-100)));
  } catch {}
}

function buildNotification(
  job: Job,
  type: NotificationType,
): AppNotification {
  const messages: Record<NotificationType, string> = {
    approved: `Your delivery was AI approved! Funds released for "${job.title}".`,
    disputed: `AI disputed your delivery on Job #${job.id}. Re-evaluate?`,
    delivered: `Freelancer submitted delivery on your Job #${job.id}.`,
    taken: `A freelancer accepted your Job #${job.id}.`,
    stale: `Your job #${job.id} has had no activity for 48+ hours.`,
  };
  return {
    id: `${job.id}-${type}-${Date.now()}`,
    type,
    message: messages[type],
    jobId: job.id,
    jobTitle: job.title,
    createdAt: Date.now(),
    read: false,
  };
}

// Derive which notification (if any) to fire for a job state transition
function detectTransition(
  prev: Job,
  curr: Job,
  userAddress: string,
): AppNotification | null {
  const addr = userAddress.toLowerCase();
  const isClient = curr.client.toLowerCase() === addr;
  const isFreelancer = curr.freelancer?.toLowerCase() === addr;

  if (prev.status === curr.status) return null;

  if (isClient) {
    if (prev.status === "open" && curr.status === "active")
      return buildNotification(curr, "taken");
    if (prev.status === "active" && curr.status === "delivered")
      return buildNotification(curr, "delivered");
    if (prev.status === "delivered" && curr.status === "completed")
      return buildNotification(curr, "approved");
    if (prev.status === "delivered" && curr.status === "disputed")
      return buildNotification(curr, "disputed");
  }

  if (isFreelancer) {
    if (prev.status === "delivered" && curr.status === "completed")
      return buildNotification(curr, "approved");
    if (prev.status === "delivered" && curr.status === "disputed")
      return buildNotification(curr, "disputed");
  }

  return null;
}

// Check for open jobs with no activity for 48h
function checkStale(job: Job, userAddress: string): boolean {
  if (job.status !== "open") return false;
  if (job.client.toLowerCase() !== userAddress.toLowerCase()) return false;
  const created = job.created_at ? new Date(job.created_at).getTime() : 0;
  return created > 0 && Date.now() - created > 48 * 60 * 60 * 1000;
}

async function fetchJobs(address: string): Promise<Job[]> {
  try {
    const [clientRaw, freelancerRaw] = await Promise.all([
      readContract("get_jobs_by_client", [address]),
      readContract("get_jobs_by_freelancer", [address]),
    ]);
    const parse = (raw: unknown): Job[] => {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? (parsed as Job[]) : [];
      } catch {
        return [];
      }
    };
    const clientJobs = parse(clientRaw);
    const freelancerJobs = parse(freelancerRaw);
    // Merge, deduplicate by id
    const map = new Map<number, Job>();
    for (const j of [...clientJobs, ...freelancerJobs]) map.set(j.id, j);
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function useNotifications() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [newToast, setNewToast] = useState<AppNotification | null>(null);
  const prevJobsRef = useRef<Map<number, Job>>(new Map());
  const staleNotifiedRef = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadStored();
    setNotifications(stored);
  }, []);

  const addNotification = useCallback((notif: AppNotification) => {
    setNotifications((prev) => {
      const updated = [...prev, notif];
      saveStored(updated);
      return updated;
    });
    setNewToast(notif);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStored(updated);
      return updated;
    });
  }, []);

  const dismissToast = useCallback(() => setNewToast(null), []);

  // Poll every 15s
  useEffect(() => {
    if (!address) return;

    const poll = async () => {
      const jobs = await fetchJobs(address);
      if (jobs.length === 0) return;

      const newNotifs: AppNotification[] = [];

      for (const job of jobs) {
        const prev = prevJobsRef.current.get(job.id);

        if (!initialized.current) {
          // First load — just record state, don't fire notifications
          prevJobsRef.current.set(job.id, job);
          continue;
        }

        if (prev) {
          const notif = detectTransition(prev, job, address);
          if (notif) newNotifs.push(notif);
        }

        // Check stale only once per job
        if (!staleNotifiedRef.current.has(job.id) && checkStale(job, address)) {
          newNotifs.push(buildNotification(job, "stale"));
          staleNotifiedRef.current.add(job.id);
        }

        prevJobsRef.current.set(job.id, job);
      }

      if (!initialized.current) {
        initialized.current = true;
        return;
      }

      for (const notif of newNotifs) {
        addNotification(notif);
      }
    };

    poll();
    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, [address, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    newToast,
    markAllRead,
    dismissToast,
  };
}
