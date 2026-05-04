import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import "./DepotCustomersDetailModal.css";

export function DepotCustomersDetailModal({ depot, customers, onClose }) {
  const { t } = useTranslation();
  if (!depot) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="depot-customers-detail-title"
      onClick={onClose}
    >
      <div
        className="panel modal-card depot-modal-card--customers"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="depot-customers-detail-title" style={{ marginTop: 0 }}>
          {t("depots.customersInDepotTitle", { depot: depot.name || t("depots.title") })}
        </h3>
        {customers.length === 0 ? (
          <p className="entity-list-empty depot-customers-modal__empty">{t("depots.customersInDepotEmpty")}</p>
        ) : (
          <DataTable className="depot-customers-modal__table-wrap">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("customers.name")}</th>
                  <th>{t("customers.phone")}</th>
                  <th>{t("customers.user")}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>
                      {c.userName || c.userUsername
                        ? [c.userName, c.userUsername].filter(Boolean).join(" · ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
        <div className="row-actions depot-customers-modal__footer">
          <Button variant="primary" onClick={onClose}>
            {t("depots.closeDetail")}
          </Button>
        </div>
      </div>
    </div>
  );
}
