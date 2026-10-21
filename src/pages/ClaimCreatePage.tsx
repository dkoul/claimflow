import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClaimForm, type ClaimFormValues } from "../components/ClaimForm";
import { api, ApiError } from "../services/api";
import type { Category } from "../types";

export function ClaimCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [limitInr, setLimitInr] = useState(25000);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([api.categories(), api.config()]).then(([cat, cfg]) => {
      setCategories(cat.categories);
      setLimitInr(cfg.singleClaimLimitInr);
    });
  }, []);

  async function handleSubmit(values: ClaimFormValues, mode: "draft" | "submit") {
    setError(null);
    try {
      const { claim } = await api.createClaim(
        {
          title: values.title,
          description: values.description,
          category: values.category,
          expenseDate: values.expenseDate,
          amount: Number(values.amount),
          receiptReference: values.receiptReference,
        },
        mode === "submit",
      );
      navigate(`/claims/${claim.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details ? Object.values(err.details).join(" ") : err.message);
      } else {
        setError("Failed to save claim");
      }
      throw err;
    }
  }

  return (
    <div className="page narrow">
      <h1>New expense claim</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <ClaimForm
        categories={categories}
        limitInr={limitInr}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
