import { useQuery } from "@tanstack/react-query";
import { getActiveSession } from "./settings.functions";

function computeYear(d = new Date()) {
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

export const activeSessionQuery = {
  queryKey: ["active-session"] as const,
  queryFn: () => getActiveSession(),
  staleTime: 5 * 60 * 1000,
};

/**
 * Returns the admin-configured active academic session, falling back to a
 * computed default while the setting loads.
 */
export function useActiveSession() {
  const q = useQuery(activeSessionQuery);
  return {
    year: q.data?.year || computeYear(),
    startDate: q.data?.startDate || "2026-08-01",
    isLoading: q.isLoading,
  };
}
