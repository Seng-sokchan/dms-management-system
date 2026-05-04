import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_MATERIAL_EDIT = { id: "", name: "", unit: "", note: "" };
const EMPTY_BORROW_EDIT = { id: "", customerId: "", materialId: "", qty: 0, note: "" };

export function BorrowedMaterialsPage({
  user,
  customers,
  borrowMaterials,
  customerBorrowedMaterials,
  newBorrowMaterial,
  setNewBorrowMaterial,
  newCustomerBorrow,
  setNewCustomerBorrow,
  onCreateBorrowMaterial,
  onUpdateBorrowMaterial,
  onDeleteBorrowMaterial,
  onSubmitCustomerBorrow,
  onDeleteCustomerBorrow,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const canManageMaterials = user?.role === "Admin" || user?.role === "Owner";

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(EMPTY_MATERIAL_EDIT);
  const isEditingMaterial = useMemo(() => Boolean(editingMaterial.id), [editingMaterial.id]);

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState(EMPTY_BORROW_EDIT);
  const isEditingBorrow = useMemo(() => Boolean(editingBorrow.id), [editingBorrow.id]);

  function startEditMaterial(material) {
    setEditingMaterial({
      id: material.id,
      name: material.name || "",
      unit: material.unit || "",
      note: material.note || "",
    });
  }

  function cancelEditMaterial() {
    setEditingMaterial(EMPTY_MATERIAL_EDIT);
  }

  async function submitMaterialEdit(event) {
    event.preventDefault();
    if (!editingMaterial.id) return;
    await onUpdateBorrowMaterial(editingMaterial.id, {
      name: editingMaterial.name,
      unit: editingMaterial.unit,
      note: editingMaterial.note,
    });
    setEditingMaterial(EMPTY_MATERIAL_EDIT);
  }

  async function handleDeleteMaterial(materialId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("borrowedMaterials.confirmDeleteMaterial", {
          defaultValue: "Delete this borrow material?",
        }),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingMaterial.id === materialId) setEditingMaterial(EMPTY_MATERIAL_EDIT);
    await onDeleteBorrowMaterial(materialId);
  }

  function startEditBorrow(borrow) {
    setEditingBorrow({
      id: borrow.id,
      customerId: borrow.customerId || "",
      materialId: borrow.materialId || "",
      qty: Number(borrow.qty || 0),
      note: borrow.note || "",
    });
  }

  function cancelEditBorrow() {
    setEditingBorrow(EMPTY_BORROW_EDIT);
  }

  async function submitBorrowEdit(event) {
    event.preventDefault();
    if (!editingBorrow.id || !editingBorrow.customerId) return;
    await onSubmitCustomerBorrow({
      customerId: editingBorrow.customerId,
      materialId: editingBorrow.materialId,
      qty: editingBorrow.qty,
      note: editingBorrow.note,
    });
    setEditingBorrow(EMPTY_BORROW_EDIT);
  }

  async function handleDeleteBorrow(customerId, materialId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("borrowedMaterials.confirmDeleteBorrow", {
          defaultValue: "Remove this borrowing record?",
        }),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingBorrow.customerId === customerId && editingBorrow.materialId === materialId) {
      setEditingBorrow(EMPTY_BORROW_EDIT);
    }
    await onDeleteCustomerBorrow(customerId, materialId);
  }

  function openMaterialModal() {
    setNewBorrowMaterial({ name: "", unit: "", note: "" });
    setShowMaterialModal(true);
  }

  function closeMaterialModal() {
    setShowMaterialModal(false);
  }

  function openBorrowModal() {
    setNewCustomerBorrow({ customerId: "", materialId: "", qty: 1, note: "" });
    setShowBorrowModal(true);
  }

  function closeBorrowModal() {
    setShowBorrowModal(false);
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("borrowedMaterials.title", { defaultValue: "Borrowed materials" })}</h2>
        <p className="section-lead">
          {t("borrowedMaterials.lead", {
            defaultValue: "Track returnable materials customers borrowed from the owner.",
          })}
        </p>
      </div>

      <section className="panel entity-list" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>
            {t("borrowedMaterials.materialsListTitle", { defaultValue: "Borrow materials" })}
          </h3>
          {canManageMaterials ? (
            <Button variant="primary" onClick={openMaterialModal}>
              {t("borrowedMaterials.newMaterial", { defaultValue: "New material" })}
            </Button>
          ) : null}
        </div>
        {borrowMaterials.length === 0 ? (
          <p className="entity-list-empty">
            {t("borrowedMaterials.materialsEmpty", { defaultValue: "No borrow materials yet." })}
          </p>
        ) : (
          <DataTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("borrowedMaterials.name", { defaultValue: "Name" })}</th>
                  <th>{t("borrowedMaterials.unit", { defaultValue: "Unit" })}</th>
                  <th>{t("borrowedMaterials.note", { defaultValue: "Note" })}</th>
                  {canManageMaterials ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {borrowMaterials.map((material) => (
                  <tr key={material.id}>
                    <td>{material.id}</td>
                    <td>{material.name}</td>
                    <td>{material.unit || "—"}</td>
                    <td>{material.note || "—"}</td>
                    {canManageMaterials ? (
                      <td>
                        <div className="row-actions">
                          <Button
                            variant="ghost"
                            tone="edit"
                            onClick={() => startEditMaterial(material)}
                          >
                            {t("borrowedMaterials.edit", { defaultValue: "Edit" })}
                          </Button>
                          <Button
                            variant="ghost"
                            tone="delete"
                            onClick={() => void handleDeleteMaterial(material.id)}
                          >
                            {t("borrowedMaterials.delete", { defaultValue: "Delete" })}
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>

      <section className="panel entity-list">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>
            {t("borrowedMaterials.borrowingsListTitle", {
              defaultValue: "Customer borrowings (current balance)",
            })}
          </h3>
          <Button
            variant="primary"
            onClick={openBorrowModal}
            disabled={borrowMaterials.length === 0 || customers.length === 0}
            title={
              borrowMaterials.length === 0 || customers.length === 0
                ? t("borrowedMaterials.needBoth", {
                    defaultValue: "Add a customer and a borrow material first.",
                  })
                : undefined
            }
          >
            {t("borrowedMaterials.setBorrowing", { defaultValue: "Set borrowing" })}
          </Button>
        </div>
        {customerBorrowedMaterials.length === 0 ? (
          <p className="entity-list-empty">
            {t("borrowedMaterials.borrowingsEmpty", { defaultValue: "No customer borrowings yet." })}
          </p>
        ) : (
          <DataTable>
              <thead>
                <tr>
                  <th>{t("borrowedMaterials.customer", { defaultValue: "Customer" })}</th>
                  <th>{t("borrowedMaterials.material", { defaultValue: "Material" })}</th>
                  <th>{t("borrowedMaterials.qty", { defaultValue: "Qty" })}</th>
                  <th>{t("borrowedMaterials.unit", { defaultValue: "Unit" })}</th>
                  <th>{t("borrowedMaterials.note", { defaultValue: "Note" })}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerBorrowedMaterials.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customerName || row.customerId || "—"}</td>
                    <td>{row.materialName || row.materialId || "—"}</td>
                    <td>{row.qty}</td>
                    <td>{row.unit || "—"}</td>
                    <td>{row.note || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          tone="edit"
                          onClick={() => startEditBorrow(row)}
                        >
                          {t("borrowedMaterials.edit", { defaultValue: "Edit" })}
                        </Button>
                        <Button
                          variant="ghost"
                          tone="delete"
                          onClick={() => void handleDeleteBorrow(row.customerId, row.materialId)}
                        >
                          {t("borrowedMaterials.remove", { defaultValue: "Remove" })}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>

      {showMaterialModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="borrow-material-create-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              await onCreateBorrowMaterial(event);
              closeMaterialModal();
            }}
          >
            <h3 id="borrow-material-create-title">
              {t("borrowedMaterials.materialFormTitle", { defaultValue: "Add borrow material" })}
            </h3>
            <label className="form-label" htmlFor="borrow-material-name">
              {t("borrowedMaterials.name", { defaultValue: "Name" })}
            </label>
            <input
              id="borrow-material-name"
              value={newBorrowMaterial.name}
              onChange={(event) => setNewBorrowMaterial((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="borrow-material-unit">
              {t("borrowedMaterials.unit", { defaultValue: "Unit" })}
            </label>
            <input
              id="borrow-material-unit"
              value={newBorrowMaterial.unit}
              placeholder={t("borrowedMaterials.unitPlaceholder", { defaultValue: "pcs, bottle, crate..." })}
              onChange={(event) => setNewBorrowMaterial((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <label className="form-label" htmlFor="borrow-material-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="borrow-material-note"
              value={newBorrowMaterial.note}
              onChange={(event) => setNewBorrowMaterial((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.save", { defaultValue: "Save" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={closeMaterialModal}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {isEditingMaterial ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="borrow-material-edit-title">
          <form className="panel form modal-card" onSubmit={submitMaterialEdit}>
            <h3 id="borrow-material-edit-title">
              {t("borrowedMaterials.materialEditTitle", { defaultValue: "Edit borrow material" })}
            </h3>
            <label className="form-label" htmlFor="borrow-material-edit-name">
              {t("borrowedMaterials.name", { defaultValue: "Name" })}
            </label>
            <input
              id="borrow-material-edit-name"
              value={editingMaterial.name}
              onChange={(event) => setEditingMaterial((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
            <label className="form-label" htmlFor="borrow-material-edit-unit">
              {t("borrowedMaterials.unit", { defaultValue: "Unit" })}
            </label>
            <input
              id="borrow-material-edit-unit"
              value={editingMaterial.unit}
              onChange={(event) => setEditingMaterial((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <label className="form-label" htmlFor="borrow-material-edit-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="borrow-material-edit-note"
              value={editingMaterial.note}
              onChange={(event) => setEditingMaterial((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.update", { defaultValue: "Update" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEditMaterial}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showBorrowModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="customer-borrow-create-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              event.preventDefault();
              await onSubmitCustomerBorrow();
              closeBorrowModal();
            }}
          >
            <h3 id="customer-borrow-create-title">
              {t("borrowedMaterials.borrowFormTitle", { defaultValue: "Set customer borrowing" })}
            </h3>
            <label className="form-label" htmlFor="customer-borrow-customer">
              {t("borrowedMaterials.customer", { defaultValue: "Customer" })}
            </label>
            <select
              id="customer-borrow-customer"
              value={newCustomerBorrow.customerId}
              onChange={(event) => setNewCustomerBorrow((prev) => ({ ...prev, customerId: event.target.value }))}
              required
            >
              <option value="">
                {t("borrowedMaterials.selectCustomer", { defaultValue: "— Select a customer —" })}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="customer-borrow-material">
              {t("borrowedMaterials.material", { defaultValue: "Material" })}
            </label>
            <select
              id="customer-borrow-material"
              value={newCustomerBorrow.materialId}
              onChange={(event) => setNewCustomerBorrow((prev) => ({ ...prev, materialId: event.target.value }))}
              required
            >
              <option value="">
                {t("borrowedMaterials.selectMaterial", { defaultValue: "— Select a material —" })}
              </option>
              {borrowMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                  {material.unit ? ` (${material.unit})` : ""}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="customer-borrow-qty">
              {t("borrowedMaterials.qty", { defaultValue: "Qty" })}
            </label>
            <input
              id="customer-borrow-qty"
              type="number"
              min={0}
              step={1}
              value={newCustomerBorrow.qty}
              onChange={(event) => setNewCustomerBorrow((prev) => ({ ...prev, qty: event.target.value }))}
              required
            />
            <label className="form-label" htmlFor="customer-borrow-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="customer-borrow-note"
              value={newCustomerBorrow.note}
              onChange={(event) => setNewCustomerBorrow((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.save", { defaultValue: "Save" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={closeBorrowModal}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {isEditingBorrow ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="customer-borrow-edit-title">
          <form className="panel form modal-card" onSubmit={submitBorrowEdit}>
            <h3 id="customer-borrow-edit-title">
              {t("borrowedMaterials.borrowEditTitle", { defaultValue: "Edit customer borrowing" })}
            </h3>
            <label className="form-label" htmlFor="customer-borrow-edit-customer">
              {t("borrowedMaterials.customer", { defaultValue: "Customer" })}
            </label>
            <input
              id="customer-borrow-edit-customer"
              value={
                customers.find((c) => String(c.id) === String(editingBorrow.customerId))?.name ||
                editingBorrow.customerId
              }
              disabled
              readOnly
            />
            <label className="form-label" htmlFor="customer-borrow-edit-material">
              {t("borrowedMaterials.material", { defaultValue: "Material" })}
            </label>
            <input
              id="customer-borrow-edit-material"
              value={
                borrowMaterials.find((m) => String(m.id) === String(editingBorrow.materialId))?.name ||
                editingBorrow.materialId
              }
              disabled
              readOnly
            />
            <label className="form-label" htmlFor="customer-borrow-edit-qty">
              {t("borrowedMaterials.qty", { defaultValue: "Qty" })}
            </label>
            <input
              id="customer-borrow-edit-qty"
              type="number"
              min={0}
              step={1}
              value={editingBorrow.qty}
              onChange={(event) => setEditingBorrow((prev) => ({ ...prev, qty: event.target.value }))}
              required
            />
            <label className="form-label" htmlFor="customer-borrow-edit-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="customer-borrow-edit-note"
              value={editingBorrow.note}
              onChange={(event) => setEditingBorrow((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.update", { defaultValue: "Update" })}
              </Button>
              <Button variant="ghost" tone="cancel" onClick={cancelEditBorrow}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
