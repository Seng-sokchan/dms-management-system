import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { FormModal } from "../../components/ui/FormModal";

function parseLossQty(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return 0;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Popup form to set loss qty for a single order (no status / delivered change). */
export function LossUpdateModal({ order, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [lossText, setLossText] = useState(String(order?.lossQty ?? 0));
  const [saving, setSaving] = useState(false);

  const orderedQty = Number(order?.orderedQty ?? 0);
  const lossQty = parseLossQty(lossText);

  const validationError = useMemo(() => {
    if (lossQty == null) {
      return t("orders.confirmInvalidLoss", {
        defaultValue: "Enter a valid loss quantity (0 or more).",
      });
    }
    if (lossQty > orderedQty) {
      return t("orders.confirmLossExceedsOrdered", {
        defaultValue: "Loss must be lower than or equal to ordered quantity ({{qty}}).",
        qty: orderedQty,
      });
    }
    return "";
  }, [lossQty, orderedQty, t]);

  const canSubmit = !validationError && !saving;

  async function handleSubmit(event) {
    event.preventDefault();
    if (validationError || lossQty == null) return;
    setSaving(true);
    try {
      await onConfirm?.({ lossQty });
    } finally {
      setSaving(false);
    }
  }

  if (!order || typeof document === "undefined") return null;

  return createPortal(
    <FormModal
      open
      size="sm"
      title={t("orders.updateLossTitle", { defaultValue: "Update loss" })}
      titleId="orders-loss-update-title"
      onClose={onClose}
      footer={
        <div className="row-actions">
          <Button type="button" variant="ghost" tone="cancel" onClick={onClose} disabled={saving}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="submit"
            form="orders-loss-update-form"
            variant="primary"
            disabled={!canSubmit}
          >
            {t("orders.updateLoss", { defaultValue: "Update" })}
          </Button>
        </div>
      }
    >
      <form id="orders-loss-update-form" className="form" onSubmit={(e) => void handleSubmit(e)}>
        <p className="form-hint" style={{ marginTop: 0 }}>
          {t("orders.updateLossLead", {
            defaultValue: "Order #{{id}} — {{customer}} · {{item}}",
            id: order.id,
            customer: order.customerName || "—",
            item: order.itemName || "—",
          })}
        </p>
        <dl className="delivery-confirm-stats">
          <div>
            <dt>{t("orders.qty")}</dt>
            <dd>{orderedQty}</dd>
          </div>
        </dl>
        <label className="form-field">
          <span className="form-label">{t("orders.loss")}</span>
          <input
            className="form-input"
            type="number"
            min={0}
            max={orderedQty}
            step={1}
            value={lossText}
            autoFocus
            aria-invalid={Boolean(validationError)}
            onChange={(e) => setLossText(e.target.value)}
          />
          <span className="form-hint">
            {t("orders.lossMaxHint", {
              defaultValue: "Must be 0 to {{qty}} (ordered quantity).",
              qty: orderedQty,
            })}
          </span>
        </label>
        {validationError ? <p className="form-error">{validationError}</p> : null}
      </form>
    </FormModal>,
    document.body,
  );
}
