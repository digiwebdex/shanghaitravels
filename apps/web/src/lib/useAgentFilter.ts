import { useSearchParams } from "react-router";

/**
 * TravelOS V4.5.3 — single source of truth for the active B2B agent filter.
 * Persists in the URL query (?agent=<uuid>) so it survives refresh and is
 * shareable; every module list reads `agentId` and forwards it to its existing
 * list endpoint (no new endpoints, no duplicated writer logic).
 */
export function useAgentFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = searchParams.get("agent") || undefined;

  const setAgent = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("agent", id);
    else next.delete("agent");
    setSearchParams(next, { replace: true });
  };

  return { agentId, setAgent, clearAgent: () => setAgent(null) };
}
