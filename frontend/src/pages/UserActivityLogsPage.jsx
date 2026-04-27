import { useTranslation } from "react-i18next";

export function UserActivityLogsPage({ activityLogs = [] }) {
  const { t } = useTranslation();

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("activityLog.title", { defaultValue: "User Activity Log" })}</h2>
        <p className="section-lead">{t("activityLog.lead", { defaultValue: "Track user actions across the system." })}</p>
      </div>
      <div className="table-wrap">
        <table className="data-table">
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
        </table>
      </div>
    </section>
  );
}
