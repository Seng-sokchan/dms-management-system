import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import { Button } from "../components/ui/Button";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createSpecialDay,
  fetchSpecialDayProgress,
  fetchSpecialDayRegistrations,
  fetchSpecialDays,
  updateSpecialDay,
  upsertSpecialDayAssignment,
} from "../services/adminApi/specialDays";
import { getSocketBaseUrl } from "../services/socketUrl";
import "./SpecialDayPage.css";

function groupByProvince(registrations, t) {
  const groups = new Map();
  for (const row of registrations || []) {
    const key = row.provinceId || row.depotId || "none";
    const label =
      row.provinceName ||
      (row.depotName ? `${t("specialDay.depotPrefix")} ${row.depotName}` : t("specialDay.unspecifiedProvince"));
    if (!groups.has(key)) {
      groups.set(key, { key, label, rows: [] });
    }
    groups.get(key).rows.push(row);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function targetLabel(row, t) {
  if (row.customerName) return row.customerName;
  if (row.depotName) return row.depotName;
  return t("specialDay.unknownTarget");
}

export function SpecialDayPage({ token, items = [], deliveryAgents = [] }) {
  const { t } = useTranslation();
  const [days, setDays] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    eventDate: "",
    itemId: "",
    notes: "",
    status: "open",
  });
  const socketRef = useRef(null);

  const selected = useMemo(
    () => days.find((d) => String(d.id) === String(selectedId)) || null,
    [days, selectedId],
  );
  const provinceGroups = useMemo(() => groupByProvince(registrations, t), [registrations, t]);

  const refreshDays = useCallback(async () => {
    if (!token) return;
    const data = await fetchSpecialDays(token);
    setDays(Array.isArray(data) ? data : []);
  }, [token]);

  const refreshDetail = useCallback(
    async (id) => {
      if (!token || !id) {
        setRegistrations([]);
        setProgress(null);
        return;
      }
      const [regs, prog] = await Promise.all([
        fetchSpecialDayRegistrations(token, id),
        fetchSpecialDayProgress(token, id),
      ]);
      setRegistrations(Array.isArray(regs) ? regs : []);
      setProgress(prog || null);
    },
    [token],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        await refreshDays();
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, t("specialDay.loadError")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshDays, t]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      setError("");
      try {
        await refreshDetail(selectedId);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, t("specialDay.loadError")));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, refreshDetail, t]);

  useEffect(() => {
    if (!token || !selectedId) return undefined;
    const baseUrl = getSocketBaseUrl();
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("subscribe:special-day", { specialDayId: selectedId });
    });
    const onUpdate = (payload) => {
      if (payload?.progress) setProgress(payload.progress);
      void refreshDetail(selectedId);
    };
    socket.on("special-day:delivery", onUpdate);
    socket.on("special-day:assignment", onUpdate);
    return () => {
      socket.emit("unsubscribe:special-day", { specialDayId: selectedId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, selectedId, refreshDetail]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.eventDate || !form.itemId) return;
    setSaving(true);
    setError("");
    try {
      const created = await createSpecialDay(token, {
        name: form.name.trim(),
        eventDate: form.eventDate,
        itemId: Number(form.itemId),
        notes: form.notes.trim() || null,
        status: form.status,
      });
      setForm({ name: "", eventDate: "", itemId: "", notes: "", status: "open" });
      await refreshDays();
      if (created?.id) setSelectedId(String(created.id));
    } catch (err) {
      setError(getApiErrorMessage(err, t("specialDay.saveError")));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await updateSpecialDay(token, selected.id, { status: nextStatus });
      await refreshDays();
      await refreshDetail(selected.id);
    } catch (err) {
      setError(getApiErrorMessage(err, t("specialDay.saveError")));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(registrationId, deliveryAgentId) {
    if (!selected || !deliveryAgentId) return;
    setSaving(true);
    setError("");
    try {
      await upsertSpecialDayAssignment(token, selected.id, {
        registrationId: Number(registrationId),
        deliveryAgentId: Number(deliveryAgentId),
      });
      await refreshDetail(selected.id);
    } catch (err) {
      setError(getApiErrorMessage(err, t("specialDay.assignError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-page special-day-page">
      <div className="section-heading">
        <h2>{t("specialDay.title")}</h2>
        <p className="section-lead">{t("specialDay.lead")}</p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p>{t("specialDay.loading")}</p> : null}

      <div className="special-day-layout">
        <div className="special-day-sidebar">
          <form className="special-day-create" onSubmit={handleCreate}>
            <h3>{t("specialDay.createTitle")}</h3>
            <label>
              <span>{t("specialDay.name")}</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>{t("specialDay.eventDate")}</span>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>{t("specialDay.item")}</span>
              <select
                value={form.itemId}
                onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}
                required
              >
                <option value="">{t("specialDay.selectItem")}</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("specialDay.notes")}</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </label>
            <Button type="submit" disabled={saving}>
              {t("specialDay.createAction")}
            </Button>
          </form>

          <div className="special-day-list">
            <h3>{t("specialDay.listTitle")}</h3>
            {days.length === 0 ? <p className="muted">{t("specialDay.emptyDays")}</p> : null}
            {days.map((day) => (
              <button
                key={day.id}
                type="button"
                className={`special-day-list-item${String(day.id) === String(selectedId) ? " is-active" : ""}`}
                onClick={() => setSelectedId(String(day.id))}
              >
                <strong>{day.name}</strong>
                <span>
                  {day.eventDate} · {t(`specialDay.status.${day.status}`, day.status)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="special-day-main">
          {!selected ? (
            <p className="muted">{t("specialDay.selectDay")}</p>
          ) : (
            <>
              <div className="special-day-header">
                <div>
                  <h3>{selected.name}</h3>
                  <p className="muted">
                    {selected.eventDate} · {selected.itemName || "—"} ·{" "}
                    {t(`specialDay.status.${selected.status}`, selected.status)}
                  </p>
                </div>
                <div className="special-day-status-actions">
                  {["open", "active", "closed"].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={selected.status === status ? "primary" : "ghost"}
                      tone={selected.status === status ? undefined : "cancel"}
                      disabled={saving || selected.status === status}
                      onClick={() => handleStatusChange(status)}
                    >
                      {t(`specialDay.status.${status}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="special-day-progress">
                <div className="special-day-stat">
                  <span>{t("specialDay.registered")}</span>
                  <strong>{progress?.registrationCount ?? 0}</strong>
                </div>
                <div className="special-day-stat">
                  <span>{t("specialDay.assigned")}</span>
                  <strong>{progress?.assignedCount ?? 0}</strong>
                </div>
                <div className="special-day-stat">
                  <span>{t("specialDay.deliveredQty")}</span>
                  <strong>{progress?.totalDeliveredQty ?? 0}</strong>
                </div>
                <div className="special-day-stat">
                  <span>{t("specialDay.trips")}</span>
                  <strong>{progress?.deliveryCount ?? 0}</strong>
                </div>
              </div>

              <div className="special-day-boards">
                <section>
                  <h4>{t("specialDay.registrationsTitle")}</h4>
                  {provinceGroups.length === 0 ? (
                    <p className="muted">{t("specialDay.emptyRegistrations")}</p>
                  ) : (
                    provinceGroups.map((group) => (
                      <div key={group.key} className="special-day-province">
                        <h5>{group.label}</h5>
                        <ul>
                          {group.rows.map((row) => (
                            <li key={row.id}>
                              <div className="special-day-reg-main">
                                <strong>{targetLabel(row, t)}</strong>
                                <span>
                                  {t("specialDay.deliveredShort")}: {row.deliveredQtyTotal || 0} (
                                  {row.deliveryCount || 0})
                                </span>
                              </div>
                              <select
                                value={row.deliveryAgentId || ""}
                                disabled={saving || selected.status === "closed"}
                                onChange={(e) => handleAssign(row.id, e.target.value)}
                              >
                                <option value="">{t("specialDay.selectAgent")}</option>
                                {deliveryAgents.map((agent) => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </option>
                                ))}
                              </select>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </section>

                <section>
                  <h4>{t("specialDay.recentDeliveries")}</h4>
                  {(progress?.recentDeliveries || []).length === 0 ? (
                    <p className="muted">{t("specialDay.emptyDeliveries")}</p>
                  ) : (
                    <ul className="special-day-recent">
                      {(progress?.recentDeliveries || []).map((d) => (
                        <li key={d.id}>
                          <strong>{d.quantity}</strong>
                          <span>
                            {d.customerName || d.depotName || "—"} · {d.deliveryAgentName || "—"}
                          </span>
                          <span className="muted">
                            {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
