import { formatCurrency } from "../utils/helpers";

export interface BudgetConfig {
  isEnabled: boolean;
  amount: string;
}

export function validateBudget(amount: string): string {
  return formatCurrency(amount);
}

export function getBudgetPrompt(amount: string): string {
  if (!amount) return "";
  return `\nBudget: Rp ${amount}`;
}
