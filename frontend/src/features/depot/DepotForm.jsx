import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "./DepotForm.css";

function formatUserOptionLabel(u) {
  const name = u?.name ? String(u.name) : "";
  const username = u?.username ? String(u.username) : "";
  if (name && username) return `${name} (${username})`;
  return name || username || String(u?.id ?? "");
}

export function DepotCreatePopupForm({ open, users = [], newDepot, setNewDepot, onCreateDepot, onClose }) {
  const { t } = useTranslation();
  if (!open) return null;

  const depotUsers = users.filter((u) => u?.isActive !== false && u?.role === "Depot");

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="depot-create-title">
      <form
        className="panel form modal-card depot-modal-card--form"
        onSubmit={async (event) => {
          await onCreateDepot(event);
          onClose();
        }}
      >
        <h3 id="depot-create-title">{t("depots.formTitle")}</h3>
        <label className="form-label" htmlFor="depot-name">
          {t("depots.name")}
        </label>
        <input
          id="depot-name"
          value={newDepot.name}
          onChange={(event) => setNewDepot((prev) => ({ ...prev, name: event.target.value }))}
          required
          minLength={2}
        />
        <label className="form-label" htmlFor="depot-phone">
          {t("depots.phone")}
        </label>
        <input
          id="depot-phone"
          value={newDepot.phone}
          onChange={(event) => setNewDepot((prev) => ({ ...prev, phone: event.target.value }))}
        />
        <label className="form-label" htmlFor="depot-address">
          {t("depots.address")}
        </label>
        <input
          id="depot-address"
          value={newDepot.address}
          onChange={(event) => setNewDepot((prev) => ({ ...prev, address: event.target.value }))}
        />
        <label className="form-label" htmlFor="depot-depot-user-id">
          {t("depots.depotUserId")}
        </label>
        <select
          id="depot-depot-user-id"
          value={newDepot.depotUserId}
          onChange={(event) => setNewDepot((prev) => ({ ...prev, depotUserId: event.target.value }))}
        >
          <option value="">{t("depots.depotUserPlaceholder")}</option>
          {depotUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {formatUserOptionLabel(u)}
            </option>
          ))}
        </select>
        <div className="row-actions">
          <Button variant="primary" type="submit">
            {t("depots.save")}
          </Button>
          <Button variant="ghost" tone="cancel" onClick={onClose}>
            {t("depots.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function DepotEditPopupForm({ open, users = [], editingDepot, setEditingDepot, onSubmitEdit, onClose }) {
  const { t } = useTranslation();
  if (!open) return null;

  const depotUsers = users.filter((u) => u?.isActive !== false && u?.role === "Depot");

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="depot-edit-title">
      <form className="panel form modal-card depot-modal-card--form" onSubmit={onSubmitEdit}>
        <h3 id="depot-edit-title">{t("depots.editTitle")}</h3>
        <label className="form-label" htmlFor="depot-edit-name">
          {t("depots.name")}
        </label>
        <input
          id="depot-edit-name"
          value={editingDepot.name}
          onChange={(event) => setEditingDepot((prev) => ({ ...prev, name: event.target.value }))}
          required
          minLength={2}
        />
        <label className="form-label" htmlFor="depot-edit-phone">
          {t("depots.phone")}
        </label>
        <input
          id="depot-edit-phone"
          value={editingDepot.phone}
          onChange={(event) => setEditingDepot((prev) => ({ ...prev, phone: event.target.value }))}
        />
        <label className="form-label" htmlFor="depot-edit-address">
          {t("depots.address")}
        </label>
        <input
          id="depot-edit-address"
          value={editingDepot.address}
          onChange={(event) => setEditingDepot((prev) => ({ ...prev, address: event.target.value }))}
        />
        <label className="form-label" htmlFor="depot-edit-depot-user-id">
          {t("depots.depotUserId")}
        </label>
        <select
          id="depot-edit-depot-user-id"
          value={editingDepot.depotUserId}
          onChange={(event) => setEditingDepot((prev) => ({ ...prev, depotUserId: event.target.value }))}
        >
          <option value="">{t("depots.depotUserPlaceholder")}</option>
          {depotUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {formatUserOptionLabel(u)}
            </option>
          ))}
        </select>
        <div className="row-actions">
          <Button variant="primary" type="submit">
            {t("depots.update")}
          </Button>
          <Button variant="ghost" tone="cancel" onClick={onClose}>
            {t("depots.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
