import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/constants";
import type { GeAgentInfoResponse } from "../types";

export function useGeAgentInfo() {
  return useQuery<GeAgentInfoResponse>({
    queryKey: ["ge-agent-info"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/ge/agent-info`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load Looker agent metadata");
      return res.json();
    },
  });
}
