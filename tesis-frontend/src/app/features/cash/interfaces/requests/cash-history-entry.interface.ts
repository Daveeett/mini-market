
export interface CashHistoryEntry {
  id: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
  openingBalance: string;
  closingBalance: string | null;
  expectedBalance: string | null;
  difference: string | null;
  totalIncomes: string;
  totalExpenses: string;
  movementCount: number;
}
