export interface CashMovement {
  id: string;
  movementType: 'INCOME' | 'EXPENSE';
  amount: string;
  concept: string;
  createdAt: string;
}
