"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { truncateAddress, formatBudget, formatDeadline } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Calendar, Wallet, User } from "lucide-react";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card className="hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <StatusBadge status={job.status} />
          </div>

          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 font-mono font-medium">
                {formatBudget(job.budget)}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDeadline(job.deadline)}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <User className="w-3.5 h-3.5" />
              {truncateAddress(job.client)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-5 bg-white/10 rounded w-2/3" />
            <div className="h-5 bg-white/10 rounded w-16" />
          </div>
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-4/5" />
          <div className="flex gap-4 pt-2">
            <div className="h-3 bg-white/5 rounded w-20" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
