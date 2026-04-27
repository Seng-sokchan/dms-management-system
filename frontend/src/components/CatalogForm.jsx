import { useTranslation } from "react-i18next";

export function CatalogForm({ newCatalog, setNewCatalog, onCreateCatalog }) {
  const { t } = useTranslation();

  return (
    <form className="panel form" onSubmit={onCreateCatalog}>
      <h3>{t("catalogs.formTitle")}</h3>
      <p className="section-lead section-lead--tight">{t("catalogs.formBlurb")}</p>
      <label className="form-label" htmlFor="catalog-name">
        {t("catalogs.labelName")}
      </label>
      <input
        id="catalog-name"
        value={newCatalog.name}
        onChange={(event) => setNewCatalog({ ...newCatalog, name: event.target.value })}
        placeholder={t("catalogs.namePh")}
        required
        minLength={2}
      />
      <label className="form-label" htmlFor="catalog-note">
        {t("catalogs.labelNote")} <span className="form-optional">({t("createOrder.optional")})</span>
      </label>
      <input
        id="catalog-note"
        value={newCatalog.note}
        onChange={(event) => setNewCatalog({ ...newCatalog, note: event.target.value })}
        placeholder={t("catalogs.notePh")}
      />
      <button type="submit" className="btn-primary">
        {t("catalogs.save")}
      </button>
    </form>
  );
}
