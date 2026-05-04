import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";
import "./BorrowedMaterialsPage.css";

const EMPTY_MATERIAL_EDIT = { id: "", name: "", unit: "", note: "" };
const EMPTY_BORROW_EDIT = { id: "", customerId: "", materialId: "", qty: 0, note: "" };

/** Calendar due dates as YYYY-MM-DD; values with a real time as YYYY-MM-DD HH:mm:ss (local). */
function formatInstallmentDueDisplay(value) {
  if (value == null || value === "") return "—";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  // DATE fields often serialize as UTC midnight — show date only, no 00:00:00.
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?Z$/i.test(s)) {
    return s.slice(0, 10);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function BorrowedMaterialsPage({
  user,
  customers,
  orders = [],
  borrowMaterials,
  customerBorrowedMaterials,
  borrowMaterialOrderLoans = [],
  borrowMaterialMonthlySchedules = [],
  newBorrowMaterial,
  setNewBorrowMaterial,
  newCustomerBorrow,
  setNewCustomerBorrow,
  newOrderLoan,
  setNewOrderLoan,
  newMonthlySchedule,
  setNewMonthlySchedule,
  onCreateBorrowMaterial,
  onUpdateBorrowMaterial,
  onDeleteBorrowMaterial,
  onSubmitCustomerBorrow,
  onDeleteCustomerBorrow,
  onSubmitBorrowMaterialOrderLoan,
  onDeleteBorrowMaterialOrderLoan,
  onSubmitBorrowMaterialMonthlySchedule,
  onDeleteBorrowMaterialMonthlySchedule,
  onLoadBorrowMaterialMonthlyScheduleDetail,
  onUpdateBorrowMaterialMonthlyInstallmentStatus,
}) {
  const { t } = useTranslation();
  const { confirm, alert } = useConfirm();
  const canManageMaterials = user?.role === "Admin" || user?.role === "Owner";

  const [borrowTab, setBorrowTab] = useState("customer");
  const [showOrderLoanModal, setShowOrderLoanModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [scheduleInstallmentModal, setScheduleInstallmentModal] = useState(null);
  const [installmentStatusSavingId, setInstallmentStatusSavingId] = useState(null);

  const customerOrders = useMemo(() => {
    if (!newOrderLoan.customerId) return [];
    return orders.filter((o) => String(o.customerId) === String(newOrderLoan.customerId));
  }, [orders, newOrderLoan.customerId]);

  const orderLoanPreview = useMemo(() => {
    const order = orders.find((o) => String(o.id) === String(newOrderLoan.orderId));
    const price = Number(newOrderLoan.fixedUnitPrice);
    if (!order || !Number.isFinite(price) || price <= 0) return null;
    const qty = Number(order.orderedQty || 0);
    return Math.round(qty * price * 100) / 100;
  }, [orders, newOrderLoan.orderId, newOrderLoan.fixedUnitPrice]);

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

  function openOrderLoanModal() {
    setNewOrderLoan({ customerId: "", materialId: "", orderId: "", fixedUnitPrice: "", note: "" });
    setShowOrderLoanModal(true);
  }

  function closeOrderLoanModal() {
    setShowOrderLoanModal(false);
  }

  function openMonthlyModal() {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    setNewMonthlySchedule({
      customerId: "",
      materialId: "",
      totalAmount: "",
      currency: "KHR",
      totalPeriod: 6,
      startDueDate: iso,
      note: "",
    });
    setShowMonthlyModal(true);
  }

  function closeMonthlyModal() {
    setShowMonthlyModal(false);
  }

  async function handleViewScheduleInstallments(customerId, scheduleId) {
    try {
      const data = await onLoadBorrowMaterialMonthlyScheduleDetail(customerId, scheduleId);
      setScheduleInstallmentModal(data);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Request failed";
      await alert({ title: t("confirm.defaultTitle"), message: String(msg) });
    }
  }

  async function handleToggleInstallmentStatus(ins) {
    const schedule = scheduleInstallmentModal?.schedule;
    if (!schedule?.id || !schedule.customerId || !onUpdateBorrowMaterialMonthlyInstallmentStatus) return;
    const nextStatus = Number(ins.status) === 1 ? 0 : 1;
    setInstallmentStatusSavingId(ins.id);
    try {
      const data = await onUpdateBorrowMaterialMonthlyInstallmentStatus(
        schedule.customerId,
        schedule.id,
        ins.id,
        nextStatus,
      );
      if (data) setScheduleInstallmentModal(data);
    } finally {
      setInstallmentStatusSavingId(null);
    }
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

      <div
        className="borrow-material-tabs"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
        role="tablist"
      >
        <Button
          type="button"
          variant={borrowTab === "customer" ? "primary" : "ghost"}
          onClick={() => setBorrowTab("customer")}
        >
          {t("borrowedMaterials.tabCustomerBorrow", { defaultValue: "1. Borrow for customer" })}
        </Button>
        <Button
          type="button"
          variant={borrowTab === "orderLoan" ? "primary" : "ghost"}
          onClick={() => setBorrowTab("orderLoan")}
        >
          {t("borrowedMaterials.tabOrderLoan", { defaultValue: "2. Loan normal (order)" })}
        </Button>
        <Button
          type="button"
          variant={borrowTab === "monthly" ? "primary" : "ghost"}
          onClick={() => setBorrowTab("monthly")}
        >
          {t("borrowedMaterials.tabMonthlySchedule", { defaultValue: "3. Loan schedule (monthly)" })}
        </Button>
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
                  <th>{t("borrowedMaterials.columnId", { defaultValue: "ID" })}</th>
                  <th>{t("borrowedMaterials.name", { defaultValue: "Name" })}</th>
                  <th>{t("borrowedMaterials.unit", { defaultValue: "Unit" })}</th>
                  <th>{t("borrowedMaterials.note", { defaultValue: "Note" })}</th>
                  {canManageMaterials ? (
                    <th>{t("borrowedMaterials.actions", { defaultValue: "Actions" })}</th>
                  ) : null}
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

      {borrowTab === "customer" ? (
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
                    <th>{t("borrowedMaterials.actions", { defaultValue: "Actions" })}</th>
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
      ) : null}

      {borrowTab === "orderLoan" ? (
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
              {t("borrowedMaterials.orderLoansTitle", {
                defaultValue: "Order-linked loans (qty × fixed unit price)",
              })}
            </h3>
            <Button
              variant="primary"
              onClick={openOrderLoanModal}
              disabled={borrowMaterials.length === 0 || customers.length === 0 || orders.length === 0}
            >
              {t("borrowedMaterials.addOrderLoan", { defaultValue: "Add order loan" })}
            </Button>
          </div>
          {borrowMaterialOrderLoans.length === 0 ? (
            <p className="entity-list-empty">
              {t("borrowedMaterials.orderLoansEmpty", { defaultValue: "No order loans yet." })}
            </p>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>{t("borrowedMaterials.customer", { defaultValue: "Customer" })}</th>
                  <th>{t("borrowedMaterials.material", { defaultValue: "Material" })}</th>
                  <th>{t("borrowedMaterials.orderId", { defaultValue: "Order" })}</th>
                  <th>{t("borrowedMaterials.orderedQty", { defaultValue: "Order qty" })}</th>
                  <th>{t("borrowedMaterials.fixedUnitPrice", { defaultValue: "Fixed unit price" })}</th>
                  <th>{t("borrowedMaterials.computedTotal", { defaultValue: "Line total" })}</th>
                  <th>{t("borrowedMaterials.currency", { defaultValue: "Currency" })}</th>
                  <th>{t("borrowedMaterials.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {borrowMaterialOrderLoans.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customerName || row.customerId}</td>
                    <td>{row.materialName || row.materialId}</td>
                    <td>{row.orderId}</td>
                    <td>{row.orderedQty}</td>
                    <td>{row.fixedUnitPrice}</td>
                    <td>{row.computedLineTotal}</td>
                    <td>{row.currency}</td>
                    <td>
                      <Button
                        variant="ghost"
                        tone="delete"
                        onClick={async () => {
                          if (
                            !(await confirm({
                              title: t("confirm.deleteTitle"),
                              message: t("borrowedMaterials.confirmDeleteOrderLoan", {
                                defaultValue: "Remove this order loan?",
                              }),
                              tone: "danger",
                            }))
                          ) {
                            return;
                          }
                          await onDeleteBorrowMaterialOrderLoan(row.customerId, row.id);
                        }}
                      >
                        {t("borrowedMaterials.remove", { defaultValue: "Remove" })}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </section>
      ) : null}

      {borrowTab === "monthly" ? (
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
              {t("borrowedMaterials.monthlySchedulesTitle", {
                defaultValue: "Monthly payment schedules",
              })}
            </h3>
            <Button
              variant="primary"
              onClick={openMonthlyModal}
              disabled={borrowMaterials.length === 0 || customers.length === 0}
            >
              {t("borrowedMaterials.addMonthlySchedule", { defaultValue: "Create schedule" })}
            </Button>
          </div>
          {borrowMaterialMonthlySchedules.length === 0 ? (
            <p className="entity-list-empty">
              {t("borrowedMaterials.monthlySchedulesEmpty", { defaultValue: "No schedules yet." })}
            </p>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>{t("borrowedMaterials.customer", { defaultValue: "Customer" })}</th>
                  <th>{t("borrowedMaterials.material", { defaultValue: "Material" })}</th>
                  <th>{t("borrowedMaterials.totalAmount", { defaultValue: "Total amount" })}</th>
                  <th>{t("borrowedMaterials.totalPeriod", { defaultValue: "Periods" })}</th>
                  <th>{t("borrowedMaterials.startDueDate", { defaultValue: "First due" })}</th>
                  <th>{t("borrowedMaterials.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {borrowMaterialMonthlySchedules.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customerName || row.customerId}</td>
                    <td>{row.materialName || row.materialId}</td>
                    <td>
                      {row.totalAmount} {row.currency}
                    </td>
                    <td>{row.totalPeriod}</td>
                    <td>{row.startDueDate}</td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          tone="edit"
                          onClick={() => void handleViewScheduleInstallments(row.customerId, row.id)}
                        >
                          {t("borrowedMaterials.viewInstallments", { defaultValue: "Installments" })}
                        </Button>
                        <Button
                          variant="ghost"
                          tone="delete"
                          onClick={async () => {
                            if (
                              !(await confirm({
                                title: t("confirm.deleteTitle"),
                                message: t("borrowedMaterials.confirmDeleteSchedule", {
                                  defaultValue: "Delete this schedule and all installments?",
                                }),
                                tone: "danger",
                              }))
                            ) {
                              return;
                            }
                            await onDeleteBorrowMaterialMonthlySchedule(row.customerId, row.id);
                          }}
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
      ) : null}

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

      {showOrderLoanModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="order-loan-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              try {
                await onSubmitBorrowMaterialOrderLoan(event);
                closeOrderLoanModal();
              } catch {
                /* error surfaced in hook */
              }
            }}
          >
            <h3 id="order-loan-title">
              {t("borrowedMaterials.orderLoanFormTitle", { defaultValue: "Add order loan" })}
            </h3>
            <label className="form-label" htmlFor="order-loan-customer">
              {t("borrowedMaterials.customer", { defaultValue: "Customer" })}
            </label>
            <select
              id="order-loan-customer"
              value={newOrderLoan.customerId}
              onChange={(event) =>
                setNewOrderLoan((prev) => ({
                  ...prev,
                  customerId: event.target.value,
                  orderId: "",
                }))
              }
              required
            >
              <option value="">{t("borrowedMaterials.selectCustomer", { defaultValue: "— Select —" })}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="order-loan-material">
              {t("borrowedMaterials.material", { defaultValue: "Material" })}
            </label>
            <select
              id="order-loan-material"
              value={newOrderLoan.materialId}
              onChange={(event) => setNewOrderLoan((prev) => ({ ...prev, materialId: event.target.value }))}
              required
            >
              <option value="">{t("borrowedMaterials.selectMaterial", { defaultValue: "— Select —" })}</option>
              {borrowMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="order-loan-order">
              {t("borrowedMaterials.orderSelect", { defaultValue: "Order (same customer)" })}
            </label>
            <select
              id="order-loan-order"
              value={newOrderLoan.orderId}
              onChange={(event) => setNewOrderLoan((prev) => ({ ...prev, orderId: event.target.value }))}
              required
              disabled={!newOrderLoan.customerId}
            >
              <option value="">
                {newOrderLoan.customerId
                  ? t("borrowedMaterials.selectOrder", { defaultValue: "— Select order —" })
                  : t("borrowedMaterials.pickCustomerFirst", { defaultValue: "— Pick customer first —" })}
              </option>
              {customerOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} · {o.itemName || o.itemId} · qty {o.orderedQty}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="order-loan-fixed">
              {t("borrowedMaterials.fixedUnitPrice", { defaultValue: "Fixed unit price" })}
            </label>
            <input
              id="order-loan-fixed"
              type="number"
              min="0"
              step="0.01"
              value={newOrderLoan.fixedUnitPrice}
              onChange={(event) => setNewOrderLoan((prev) => ({ ...prev, fixedUnitPrice: event.target.value }))}
              required
            />
            {orderLoanPreview != null ? (
              <p className="section-lead" style={{ marginTop: 8, marginBottom: 0 }}>
                {t("borrowedMaterials.orderLoanPreview", {
                  defaultValue: "Computed line total: {{total}}",
                  total: orderLoanPreview,
                })}
              </p>
            ) : null}
            <label className="form-label" htmlFor="order-loan-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="order-loan-note"
              value={newOrderLoan.note}
              onChange={(event) => setNewOrderLoan((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.save", { defaultValue: "Save" })}
              </Button>
              <Button variant="ghost" tone="cancel" type="button" onClick={closeOrderLoanModal}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showMonthlyModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="monthly-schedule-title">
          <form
            className="panel form modal-card"
            onSubmit={async (event) => {
              try {
                await onSubmitBorrowMaterialMonthlySchedule(event);
                closeMonthlyModal();
              } catch {
                /* error surfaced in hook */
              }
            }}
          >
            <h3 id="monthly-schedule-title">
              {t("borrowedMaterials.monthlyFormTitle", { defaultValue: "Create monthly schedule" })}
            </h3>
            <label className="form-label" htmlFor="monthly-customer">
              {t("borrowedMaterials.customer", { defaultValue: "Customer" })}
            </label>
            <select
              id="monthly-customer"
              value={newMonthlySchedule.customerId}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, customerId: event.target.value }))
              }
              required
            >
              <option value="">{t("borrowedMaterials.selectCustomer", { defaultValue: "— Select —" })}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="monthly-material">
              {t("borrowedMaterials.material", { defaultValue: "Material" })}
            </label>
            <select
              id="monthly-material"
              value={newMonthlySchedule.materialId}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, materialId: event.target.value }))
              }
              required
            >
              <option value="">{t("borrowedMaterials.selectMaterial", { defaultValue: "— Select —" })}</option>
              {borrowMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <label className="form-label" htmlFor="monthly-total">
              {t("borrowedMaterials.totalAmount", { defaultValue: "Total amount" })}
            </label>
            <input
              id="monthly-total"
              type="number"
              min="0"
              step="0.01"
              value={newMonthlySchedule.totalAmount}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, totalAmount: event.target.value }))
              }
              required
            />
            <label className="form-label" htmlFor="monthly-currency">
              {t("borrowedMaterials.currency", { defaultValue: "Currency" })}
            </label>
            <select
              id="monthly-currency"
              value={newMonthlySchedule.currency}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, currency: event.target.value }))
              }
            >
              <option value="KHR">KHR</option>
              <option value="USD">USD</option>
            </select>
            <label className="form-label" htmlFor="monthly-period">
              {t("borrowedMaterials.totalPeriodMonths", { defaultValue: "Total periods (months)" })}
            </label>
            <input
              id="monthly-period"
              type="number"
              min={1}
              step={1}
              value={newMonthlySchedule.totalPeriod}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, totalPeriod: event.target.value }))
              }
              required
            />
            <label className="form-label" htmlFor="monthly-start">
              {t("borrowedMaterials.startDueDate", { defaultValue: "First due date" })}
            </label>
            <input
              id="monthly-start"
              type="date"
              value={newMonthlySchedule.startDueDate}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, startDueDate: event.target.value }))
              }
              required
            />
            <label className="form-label" htmlFor="monthly-note">
              {t("borrowedMaterials.note", { defaultValue: "Note" })}
            </label>
            <input
              id="monthly-note"
              value={newMonthlySchedule.note}
              onChange={(event) =>
                setNewMonthlySchedule((prev) => ({ ...prev, note: event.target.value }))
              }
            />
            <div className="row-actions">
              <Button variant="primary" type="submit">
                {t("borrowedMaterials.createSchedule", { defaultValue: "Generate schedule" })}
              </Button>
              <Button variant="ghost" tone="cancel" type="button" onClick={closeMonthlyModal}>
                {t("borrowedMaterials.cancel", { defaultValue: "Cancel" })}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {scheduleInstallmentModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="installments-title">
          <div className="panel form modal-card borrow-installments-modal">
            <h3 id="installments-title">
              {t("borrowedMaterials.installmentsTitle", { defaultValue: "Installments" })}
            </h3>
            {scheduleInstallmentModal.schedule ? (
              <p className="section-lead" style={{ marginTop: 0 }}>
                {scheduleInstallmentModal.schedule.customerName} ·{" "}
                {scheduleInstallmentModal.schedule.materialName} ·{" "}
                {scheduleInstallmentModal.schedule.totalAmount}{" "}
                {scheduleInstallmentModal.schedule.currency} / {scheduleInstallmentModal.schedule.totalPeriod}{" "}
                {t("borrowedMaterials.months", { defaultValue: "months" })}
              </p>
            ) : null}
            <DataTable>
              <thead>
                <tr>
                  <th>{t("borrowedMaterials.periodNo", { defaultValue: "No." })}</th>
                  <th>{t("borrowedMaterials.dueDate", { defaultValue: "Due" })}</th>
                  <th>{t("borrowedMaterials.amountDue", { defaultValue: "Due" })}</th>
                  <th>{t("borrowedMaterials.installmentStatus", { defaultValue: "Status" })}</th>
                  <th>{t("borrowedMaterials.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {(scheduleInstallmentModal.installments || []).map((ins) => (
                  <tr key={ins.id}>
                    <td>{ins.periodNo}</td>
                    <td>{formatInstallmentDueDisplay(ins.dueDate)}</td>
                    <td>{ins.amountDue}</td>
                    <td>
                      {Number(ins.status) === 1
                        ? t("borrowedMaterials.installmentPaid", { defaultValue: "Paid" })
                        : t("borrowedMaterials.installmentUnpaid", { defaultValue: "Unpaid" })}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={installmentStatusSavingId === ins.id || !onUpdateBorrowMaterialMonthlyInstallmentStatus}
                        onClick={() => handleToggleInstallmentStatus(ins)}
                      >
                        {Number(ins.status) === 1
                          ? t("borrowedMaterials.markInstallmentUnpaid", { defaultValue: "Mark unpaid" })
                          : t("borrowedMaterials.markInstallmentPaid", { defaultValue: "Mark paid" })}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <div className="row-actions">
              <Button variant="ghost" tone="cancel" type="button" onClick={() => setScheduleInstallmentModal(null)}>
                {t("borrowedMaterials.close", { defaultValue: "Close" })}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
