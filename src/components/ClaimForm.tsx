import { useEffect, useState } from "react";
import type { Category, Claim } from "../types";
import { formatInr } from "../utils/format";

export interface ClaimFormValues {
  title: string;
  description: string;
  category: string;
  expenseDate: string;
  amount: string;
  receiptReference: string;
}

interface ClaimFormProps {
  initial?: Partial<Claim>;
  categories: Category[];
  limitInr: number;
  onSubmit: (values: ClaimFormValues, mode: "draft" | "submit") => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function ClaimForm({
  initial,
  categories,
  limitInr,
  onSubmit,
  submitLabel = "Save draft",
  disabled,
}: ClaimFormProps) {
  const [values, setValues] = useState<ClaimFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    expenseDate: initial?.expenseDate ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    receiptReference: initial?.receiptReference ?? "",
  });
  const [clientError, setClientError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setValues({
        title: initial.title ?? "",
        description: initial.description ?? "",
        category: initial.category ?? "",
        expenseDate: initial.expenseDate ?? "",
        amount: initial.amount != null ? String(initial.amount) : "",
        receiptReference: initial.receiptReference ?? "",
      });
    }
  }, [initial?.id, initial?.version]);

  function validate(): string | null {
    if (!values.title.trim()) return "Title is required";
    if (!values.description.trim()) return "Description is required";
    if (!values.category) return "Category is required";
    if (!values.expenseDate) return "Expense date is required";
    const amount = Number(values.amount);
    if (!values.amount || Number.isNaN(amount) || amount <= 0) {
      return "Amount must be greater than zero";
    }
    if (amount > limitInr) {
      return `Amount cannot exceed ${formatInr(limitInr)}`;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(values.expenseDate + "T00:00:00");
    if (exp > today) return "Expense date cannot be in the future";
    return null;
  }

  async function handle(mode: "draft" | "submit") {
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setClientError(null);
    setSaving(true);
    try {
      await onSubmit(values, mode);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        void handle("draft");
      }}
    >
      {clientError && <div className="alert alert-error" role="alert">{clientError}</div>}

      <label>
        Title <span className="req">*</span>
        <input
          required
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          disabled={disabled || saving}
        />
      </label>

      <label className="full">
        Description <span className="req">*</span>
        <textarea
          required
          rows={4}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          disabled={disabled || saving}
        />
      </label>

      <label>
        Category <span className="req">*</span>
        <select
          required
          value={values.category}
          onChange={(e) => setValues({ ...values, category: e.target.value })}
          disabled={disabled || saving}
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </label>

      <label>
        Expense date <span className="req">*</span>
        <input
          type="date"
          required
          value={values.expenseDate}
          onChange={(e) => setValues({ ...values, expenseDate: e.target.value })}
          disabled={disabled || saving}
        />
      </label>

      <label>
        Amount (INR) <span className="req">*</span>
        <input
          type="number"
          min={1}
          max={limitInr}
          step="0.01"
          required
          value={values.amount}
          onChange={(e) => setValues({ ...values, amount: e.target.value })}
          disabled={disabled || saving}
        />
      </label>

      <label>
        Receipt reference
        <input
          value={values.receiptReference}
          onChange={(e) => setValues({ ...values, receiptReference: e.target.value })}
          disabled={disabled || saving}
        />
      </label>

      <div className="form-actions full">
        <button type="submit" className="btn" disabled={disabled || saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || saving}
          onClick={() => void handle("submit")}
        >
          {saving ? "Submitting…" : "Submit for approval"}
        </button>
      </div>
    </form>
  );
}
