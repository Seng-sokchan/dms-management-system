import { useTranslation } from "react-i18next";
import { DataTable } from "../components/ui/DataTable";

export function UserActivityLogsPage({ activityLogs = [] }) {
  const { t } = useTranslation();
  const today = new Date();
  const totalRequestEndpointToday = activityLogs.reduce((sum, row) => {
    if (!row?.createdAt) return sum;
    const logDate = new Date(row.createdAt);
    if (Number.isNaN(logDate.getTime())) return sum;
    const isToday = logDate.getFullYear() === today.getFullYear()
      && logDate.getMonth() === today.getMonth()
      && logDate.getDate() === today.getDate();
    return isToday ? sum + 1 : sum;
  }, 0);

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("activityLog.title", { defaultValue: "User Activity Log" })}</h2>
        <p className="section-lead">{t("activityLog.lead", { defaultValue: "Track user actions across the system." })}</p>
        <p className="section-lead">
          {t("activityLog.totalRequestEndpointToday", { defaultValue: "Total Request Endpoint Today" })}:{" "}
          {totalRequestEndpointToday}
        </p>
      </div>
      <DataTable>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Role</th>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map((row) => (
              <tr key={row.id}>
                <td>{row.createdAt}</td>
                <td>{row.username || "Unknown"}</td>
                <td>{row.role || "-"}</td>
                <td>{row.method}</td>
                <td>{row.path}</td>
                <td>{row.statusCode}</td>
                <td>{row.message}</td>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </section>
  );
}
