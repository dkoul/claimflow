import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClaimForm, type ClaimFormValues } from "../components/ClaimForm";
import { api, ApiError } from "../services/api";
import type { Category, Claim } from "../types";

export function ClaimEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [limitInr, setLimitInr] = useState(25000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [claimRes, catRes, cfg] = await Promise.all([
          api.getClaim(id),
          api.categories(),
          api.config(),
        ]);
        setClaim(claimRes.claim);
        setCategories(catRes.categories);
        setLimitInr(cfg.singleClaimLimitInr);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load claim");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function save(values: ClaimFormValues, mode: "draft" | "submit") {
    if (!claim || !id) return;
    setError(null);
    try {
      const { claim: updated } = await api.updateClaim(id, {
        title: values.title,
        description: values.description,
        category: values.category,
        expenseDate: values.expenseDate,
        amount: Number(values.amount),
        receiptReference: values.receiptReference,
        version: claim.version,
      });
      if (mode === "submit") {
        const { claim: submitted } = await api.submitClaim(id);
        navigate(`/claims/${submitted.id}`);
      } else {
        navigate(`/claims/${updated.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? err.message
            : err.details
              ? Object.values(err.details).join(" ")
              : err.message,
        );
      } else {
        setError("Failed to update claim");
      }
      throw err;
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!claim) {
    return (
      <div className="page">
        <div className="alert alert-error">{error ?? "Claim not found"}</div>
        <Link to="/claims">Back to claims</Link>
      </div>
    );
  }

  if (claim.status !== "DRAFT" && claim.status !== "REJECTED") {
    return (
      <div className="page">
        <div className="alert alert-error">This claim cannot be edited.</div>
        <Link to={`/claims/${claim.id}`}>View claim</Link>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <h1>Edit {claim.id}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <ClaimForm
        initial={claim}
        categories={categories}
        limitInr={limitInr}
        onSubmit={save}
        submitLabel="Save changes"
      />
    </div>
  );
}
