

export interface DashboardStats {
  semaphore: { green: number; yellow: number; red: number };
  cashChart: Array<{ date: string; income: number; expense: number }>;
}
