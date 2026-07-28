import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { FormModal } from "../../components/ui/FormModal";

function DepotFields({ mode, formId, value, onChange, onSubmit }) {
  const { t } = useTranslation();
  const prefix = mode === "edit" ? "depot-edit" : "depot";

  function patch(partial) {
    onChange((prev) => ({ ...prev, ...partial }));
  }

  return (
    <form id={formId} className="form" onSubmit={onSubmit}>
      <div className="form-grid form-grid--2">
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-name`}>
            {t("depots.name")}
          </label>
          <input
            id={`${prefix}-name`}
            value={value.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            required
            minLength={2}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor={`${prefix}-phone`}>
            {t("depots.phone")}
          </label>
          <input
            id={`${prefix}-phone`}
            value={value.phone || ""}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </div>
        <div className="form-field form-grid--full">
          <label className="form-label" htmlFor={`${prefix}-address`}>
            {t("depots.address")}
          </label>
          <input
            id={`${prefix}-address`}
            value={value.address || ""}
            onChange={(event) => patch({ address: event.target.value })}
          />
        </div>
      </div>
    </form>
  );
}

export function DepotCreatePopupForm({ open, newDepot, setNewDepot, onCreateDepot, onClose }) {
  const { t } = useTranslation();
  const formId = "depot-create-form";

  return (
    <FormModal
      open={open}
      title={t("depots.formTitle")}
      titleId="depot-create-title"
      size="md"
      onClose={onClose}
      footer={
        <div className="row-actions">
          <Button variant="ghost" tone="cancel" onClick={onClose}>
            {t("depots.cancel")}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {t("depots.save")}
          </Button>
        </div>
      }
    >
      <DepotFields
        mode="create"
        formId={formId}
        value={newDepot}
        onChange={setNewDepot}
        onSubmit={async (event) => {
          await onCreateDepot(event);
          onClose();
        }}
      />
    </FormModal>
  );
}

export function DepotEditPopupForm({ open, editingDepot, setEditingDepot, onSubmitEdit, onClose }) {
  const { t } = useTranslation();
  const formId = "depot-edit-form";

  return (
    <FormModal
      open={open}
      title={t("depots.editTitle")}
      titleId="depot-edit-title"
      size="md"
      onClose={onClose}
      footer={
        <div className="row-actions">
          <Button variant="ghost" tone="cancel" onClick={onClose}>
            {t("depots.cancel")}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {t("depots.update")}
          </Button>
        </div>
      }
    >
      <DepotFields
        mode="edit"
        formId={formId}
        value={editingDepot}
        onChange={setEditingDepot}
        onSubmit={onSubmitEdit}
      />
    </FormModal>
  );
}
