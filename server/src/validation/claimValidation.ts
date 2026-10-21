import type { AppConfig, ClaimCategory } from "../types.js";
import { AppError } from "../utils/errors.js";

const CATEGORIES: ClaimCategory[] = [
  "TRAVEL",
  "MEALS",
  "ACCOMMODATION",
  "EQUIPMENT",
  "OTHER",
];

export interface ClaimInput {
  title?: string;
  description?: string;
  category?: string;
  expenseDate?: string;
  amount?: number;
  receiptReference?: string;
}

export function validateClaimFields(
  input: ClaimInput,
  config: AppConfig,
): {
  title: string;
  description: string;
  category: ClaimCategory;
  expenseDate: string;
  amount: number;
  receiptReference: string;
} {
  const errors: Record<string, string> = {};

  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();
  const category = input.category as ClaimCategory;
  const expenseDate = (input.expenseDate ?? "").trim();
  const receiptReference = (input.receiptReference ?? "").trim();

  if (!title) errors.title = "Title is required";
  if (!description) errors.description = "Description is required";
  if (!category || !CATEGORIES.includes(category)) {
    errors.category = "Valid category is required";
  }

  if (!expenseDate) {
    errors.expenseDate = "Expense date is required";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expenseDate + "T00:00:00");
    if (Number.isNaN(exp.getTime())) {
      errors.expenseDate = "Invalid expense date";
    } else if (exp > today) {
      errors.expenseDate = "Expense date cannot be in the future";
    }
  }

  const amount = input.amount;
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    errors.amount = "Amount is required";
  } else if (Number(amount) <= 0) {
    errors.amount = "Amount must be greater than zero";
  } else if (Number(amount) > config.singleClaimLimitInr) {
    errors.amount = `Amount cannot exceed ₹${config.singleClaimLimitInr.toLocaleString("en-IN")}`;
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(422, "Validation failed", "VALIDATION_ERROR", errors);
  }

  return {
    title,
    description,
    category,
    expenseDate,
    amount: Number(amount),
    receiptReference,
  };
}
