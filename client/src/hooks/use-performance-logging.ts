import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  PerformanceLog,
  InsertPerformanceLog,
  PerformanceEntry,
  InsertPerformanceEntry,
  IranHoliday,
  InsertIranHoliday,
} from "@shared/schema";

// Performance Logs Hooks

export function usePerformanceLogs() {
  return useQuery<PerformanceLog[]>({
    queryKey: ["/api/performance-logs"],
  });
}

export function usePerformanceLog(year: number, month: number) {
  return useQuery<PerformanceLog>({
    queryKey: ["/api/performance-logs", year.toString(), month.toString()],
    enabled: !!(year && month),
    retry: (failureCount, error) => {
      // Don't retry on 404 errors - the log simply doesn't exist yet
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return false;
      }
      // Only retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePerformanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertPerformanceLog) => {
      const response = await apiRequest("POST", "/api/performance-logs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs"] });
    },
  });
}

export function useUpdatePerformanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPerformanceLog> }) => {
      const response = await apiRequest("PUT", `/api/performance-logs/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs", id] });
    },
  });
}

export function useFinalizePerformanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const response = await apiRequest("POST", `/api/performance-logs/${logId}/finalize`);
      return response.json();
    },
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs", logId] });
    },
  });
}

// Performance Entries Hooks

export function usePerformanceLogEntries(logId: string) {
  return useQuery<PerformanceEntry[]>({
    queryKey: ["/api/performance-logs", logId, "entries"],
    enabled: !!logId,
  });
}

export function useBatchCreateOrUpdateEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      logId, 
      entries 
    }: { 
      logId: string; 
      entries: InsertPerformanceEntry[] 
    }) => {
      const response = await apiRequest(
        "POST", 
        `/api/performance-logs/${logId}/entries/batch`, 
        { entries }
      );
      return response.json();
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs", logId, "entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-logs", logId] });
    },
  });
}

// Iran Holidays Hooks

export function useHolidays(year: number, month: number) {
  return useQuery<IranHoliday[]>({
    queryKey: ["/api/holidays"],
    queryFn: async () => {
      const response = await fetch(`/api/holidays?year=${year}&month=${month}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    },
    enabled: !!(year && month),
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertIranHoliday) => {
      const response = await apiRequest("POST", "/api/holidays", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holidayId: string) => {
      const response = await apiRequest("DELETE", `/api/holidays/${holidayId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
    },
  });
}

// Helper hooks for performance logging workflow

export function usePerformanceLogWorkflow(year: number, month: number) {
  const performanceLogQuery = usePerformanceLog(year, month);
  const entriesQuery = usePerformanceLogEntries(performanceLogQuery.data?.id || "");
  const holidaysQuery = useHolidays(year, month);

  const createLogMutation = useCreatePerformanceLog();
  const updateLogMutation = useUpdatePerformanceLog();
  const finalizeLogMutation = useFinalizePerformanceLog();
  const batchEntriesMutation = useBatchCreateOrUpdateEntries();

  // Helper function to create log if it doesn't exist
  const ensureLogExists = async () => {
    if (!performanceLogQuery.data) {
      // The backend will set userId and baseId from session and user profile
      return createLogMutation.mutateAsync({ 
        year, 
        month,
        userId: "", // Will be overridden by backend
        baseId: "", // Will be set by backend based on user profile
      });
    }
    return performanceLogQuery.data;
  };

  // Helper function to save draft entries
  const saveDraftEntries = async (entries: InsertPerformanceEntry[]) => {
    const log = await ensureLogExists();
    return batchEntriesMutation.mutateAsync({
      logId: log.id,
      entries,
    });
  };

  // Helper function to finalize the entire log
  const finalizeLog = async () => {
    if (performanceLogQuery.data) {
      return finalizeLogMutation.mutateAsync(performanceLogQuery.data.id);
    }
    throw new Error("لاگ عملکرد یافت نشد");
  };

  return {
    // Data
    performanceLog: performanceLogQuery.data,
    entries: entriesQuery.data || [],
    holidays: holidaysQuery.data || [],
    
    // Loading states
    isLoadingLog: performanceLogQuery.isLoading,
    isLoadingEntries: entriesQuery.isLoading,
    isLoadingHolidays: holidaysQuery.isLoading,
    
    // Error states
    logError: performanceLogQuery.error,
    entriesError: entriesQuery.error,
    holidaysError: holidaysQuery.error,
    
    // Mutation states
    isCreatingLog: createLogMutation.isPending,
    isUpdatingLog: updateLogMutation.isPending,
    isFinalizingLog: finalizeLogMutation.isPending,
    isSavingEntries: batchEntriesMutation.isPending,
    
    // Helper functions
    ensureLogExists,
    saveDraftEntries,
    finalizeLog,
    
    // Raw mutations
    createLog: createLogMutation.mutate,
    updateLog: updateLogMutation.mutate,
    batchUpdateEntries: batchEntriesMutation.mutate,
  };
}

// Type helpers for the frontend components
export type PerformanceLogStatus = "draft" | "finalized";

export interface PerformanceGridData {
  personnelId: string;
  personnelName: string;
  entries: Map<string, PerformanceEntry>; // key is date string
  totalMissions: number;
  totalMeals: number;
}

export interface CalendarDay {
  date: string; // Jalali date (YYYY-MM-DD)
  day: number;
  weekday: string;
  isHoliday: boolean;
  isWeekend: boolean; // Friday
  isOfficialHoliday?: boolean;
  holidayTitle?: string;
}