import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

export function useAuth() {
  const { data, isLoading, isError } = useQuery<User | null>({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      try {
        return await apiGet<User>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        return null;
      }
    },
  });
  return { user: data ?? null, isLoading, isError };
}

export function useSession() {
  const qc = useQueryClient();
  return {
    async beginSession() {
      await qc.invalidateQueries();
    },
    async endSession() {
      await apiPost("/auth/logout");
      qc.clear();
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
  };
}
