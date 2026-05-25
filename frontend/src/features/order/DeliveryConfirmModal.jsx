import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";

function parseLossQty(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return 0;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function DeliveryConfirmModal({ order, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [lossText, setLossText] = useState("0");
  const [error, setError] = useState("");

  const orderedQty = Number(order?.orderedQty ?? 0);
  const lossQty = parseLossQty(lossText);
  const deliveredQty =
    lossQty != null && lossQty <= orderedQty ? Math.max(0, orderedQty - lossQty) : null;

  useEffect(() => {
    setLossText("0");
    setError("");
  }, [order?.id]);

  const canSubmit = useMemo(() => {
    if (lossQty == null) return false;
    return lossQty <= orderedQty;
  }, [lossQty, orderedQty]);

  function handleSubmit(event) {
    event.preventDefault();
    if (lossQty == null) {
      setError(t("orders.confirmInvalidLoss", { defaultValue: "Enter a valid loss quantity (0 or more)." }));
      return;
    }
    if (lossQty > orderedQty) {
      setError(
        t("orders.confirmLossExceedsOrdered", {
          defaultValue: "Loss cannot exceed ordered quantity.",
        }),
      );
      return;
    }
    onConfirm?.({ lossQty });
  }

  if (!order) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <form
        className="panel modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 style={{ marginTop: 0 }}>{t("orders.confirmDeliveryTitle", { defaultValue: "Confirm delivery" })}</h3>
        <p className="form-hint">
          {t("orders.confirmDeliveryLead", {
            defaultValue: "Order #{{id}} — {{customer}}",
            id: order.id,
            customer: order.customerName || "—",
          })}
        </p>
        <dl className="delivery-confirm-stats">
          <div>
            <dt>{t("orders.qty")}</dt>
            <dd>{orderedQty}</dd>
          </div>
          <div>
            <dt>{t("orders.distributed")}</dt>
            <dd>{deliveredQty != null ? deliveredQty : "—"}</dd>
          </div>
        </dl>
        <label className="form-field">
          <span className="form-label">{t("orders.loss")}</span>
          <input
            className="form-input"
            type="number"
            min={0}
            step={1}
            value={lossText}
            onChange={(e) => {
              setLossText(e.target.value);
              setError("");
            }}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="row-actions" style={{ marginTop: "1rem" }}>
          <Button type="button" variant="ghost" tone="cancel" onClick={onClose}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {t("orders.confirmDeliverySubmit", { defaultValue: "Confirm" })}
          </Button>
        </div>
      </form>
    </div>
  );
}
