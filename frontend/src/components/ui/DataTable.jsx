import "./DataTable.css";

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children — table rows (thead + tbody)
 * @param {string} [props.className] — merged onto the scroll wrapper (.table-wrap)
 * @param {string} [props.tableClassName] — extra classes on the table element
 */
export function DataTable({ children, className = "", tableClassName = "" }) {
  const wrap = ["table-wrap", className].filter(Boolean).join(" ");
  const tbl = ["data-table", tableClassName].filter(Boolean).join(" ");
  return (
    <div className={wrap}>
      <table className={tbl}>{children}</table>
    </div>
  );
}
