import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getActiveSession } from "./settings.functions";
import { setActivePdfSession } from "./pdf-session";

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
 * computed default while the setting loads. Also mirrors the value into the
 * shared PDF-session cache so generated PDFs print the correct header.
 */
export function useActiveSession() {
  const q = useQuery(activeSessionQuery);
  const year = q.data?.year || computeYear();
  const startDate = q.data?.startDate || "2026-08-01";
  useEffect(() => {
    setActivePdfSession({ year, startDate });
  }, [year, startDate]);
  return { year, startDate, isLoading: q.isLoading };
}

