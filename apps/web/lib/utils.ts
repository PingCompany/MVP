import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-amber-500 to-yellow-300",
  "from-emerald-500 to-teal-400",
  "from-cyan-500 to-sky-400",
  "from-blue-500 to-indigo-400",
  "from-violet-500 to-purple-400",
  "from-fuchsia-500 to-pink-400",
  "from-pink-500 to-rose-400",
  "from-teal-500 to-emerald-400",
  "from-indigo-500 to-blue-400",
  "from-orange-500 to-amber-400",
  "from-sky-500 to-cyan-400",
];

/**
 * Returns a deterministic Tailwind gradient class based on a seed string
 * (typically `authorId + initials` for uniqueness).
 */
export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === "number" ? date : date.getTime();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (diff < 0) return "in the future";
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}
