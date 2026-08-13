"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Repository } from "@/lib/repropulse-api";

export function RepositorySwitcher({
  repositories,
  selectedRepositoryId,
}: {
  repositories: Repository[];
  selectedRepositoryId: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-stone-500">
      <span className="hidden sm:inline">Repository</span>

      <select
        value={selectedRepositoryId}
        onChange={(event) => {
          router.push(
            `${pathname}?repository=${encodeURIComponent(event.target.value)}`
          );
        }}
        className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm font-medium text-stone-800 outline-none focus:border-slate-400"
      >
        {repositories.map((repository) => (
          <option key={repository.id} value={repository.id}>
            {repository.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}
