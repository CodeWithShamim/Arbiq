import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatBudget(wei: number): string {
  const gen = wei / 1e18;
  return gen.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " GEN";
}

export function formatDeadline(dateStr: string): string {
  if (!dateStr) return "No deadline";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function isDeadlinePast(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
