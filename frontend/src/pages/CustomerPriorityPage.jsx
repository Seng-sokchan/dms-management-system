import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { canManageMenuKey } from "../constants/menus";
import { PrioritySortableList } from "../features/customerPriority/PrioritySortableList";
import { getApiErrorMessage } from "../services/apiClient";
import {
  fetchCustomerPriorities,
  saveCustomerPriorities,
} from "../services/adminApi/customerPriorities";
import "./CustomerPriorityPage.css";

function customerIdsKey(customers) {
  return (customers || []).map((c) => String(c.id)).join(",");
}

export function CustomerPriorityPage({ token, user, provinces = [] }) {
  const { t } = useTranslation();
  const { alert } = useConfirm();
  const canManage = canManageMenuKey(user, "customerPriority");

  const [provinceId, setProvinceId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [savedKey, setSavedKey] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = useMemo(
    () => Boolean(provinceId) && customerIdsKey(customers) !== savedKey,
    [provinceId, customers, savedKey],
  );

  const applyPayload = useCallback((data) => {
    const list = Array.isArray(data?.customers) ? data.customers : [];
    setCustomers(list);
    setSavedKey(customerIdsKey(list));
    setProvinceName(data?.provinceName || "");
  }, []);

  const loadProvince = useCallback(
    async (id) => {
      if (!token || !id) {
        setCustomers([]);
        setSavedKey("");
        setProvinceName("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await fetchCustomerPriorities(token, id);
        applyPayload(data);
      } catch (err) {
        setCustomers([]);
        setSavedKey("");
        setProvinceName("");
        setError(getApiErrorMessage(err, t("customerPriority.loadError")));
      } finally {
        setLoading(false);
      }
    },
    [token, applyPayload, t],
  );

  useEffect(() => {
    if (!provinceId) {
      setCustomers([]);
      setSavedKey("");
      setProvinceName("");
      setError("");
      return;
    }
    loadProvince(provinceId);
  }, [provinceId, loadProvince]);

  async function handleSave() {
    if (!canManage || !provinceId || !dirty) return;
    setSaving(true);
    setError("");
    try {
      const data = await saveCustomerPriorities(token, {
        provinceId,
        customerIds: customers.map((c) => String(c.id)),
      });
      applyPayload(data);
      await alert({
        title: t("confirm.successTitle"),
        message: t("customerPriority.saveSuccess"),
        tone: "primary",
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t("customerPriority.saveError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page customer-priority-page">
      <header className="section-heading">
        <div>
          <h2>{t("customerPriority.title")}</h2>
          <p className="section-lead">{t("customerPriority.lead")}</p>
        </div>
      </header>

      <section className="panel customer-priority-panel">
        <div className="form-field customer-priority-province">
          <label className="form-label" htmlFor="customer-priority-province">
            {t("customerPriority.province")}
          </label>
          <select
            id="customer-priority-province"
            value={provinceId}
            onChange={(event) => setProvinceId(event.target.value)}
          >
            <option value="">{t("customerPriority.selectProvince")}</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="form-error customer-priority-error">{error}</p> : null}

        {!provinceId ? (
          <p className="entity-list-empty">{t("customerPriority.pickProvince")}</p>
        ) : loading ? (
          <p className="entity-list-empty">{t("customerPriority.loading")}</p>
        ) : customers.length === 0 ? (
          <p className="entity-list-empty">{t("customerPriority.empty")}</p>
        ) : (
          <>
            <div className="customer-priority-list-header">
              <h3>
                {t("customerPriority.listTitle")}
                {provinceName ? ` — ${provinceName}` : ""}
              </h3>
              <Button
                type="button"
                variant="primary"
                disabled={!canManage || !dirty || saving}
                onClick={handleSave}
              >
                {saving ? t("customerPriority.saving") : t("customerPriority.save")}
              </Button>
            </div>
            <div className="customer-priority-columns" aria-hidden="true">
              <span />
              <span>{t("customerPriority.colPriority")}</span>
              <span>{t("customerPriority.colCustomer")}</span>
              <span>{t("customerPriority.colDepot")}</span>
            </div>
            <PrioritySortableList
              customers={customers}
              disabled={!canManage || saving}
              onReorder={setCustomers}
            />
          </>
        )}
      </section>
    </div>
  );
}
