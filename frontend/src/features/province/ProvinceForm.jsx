import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "../catalog/CatalogForm.css";

export function ProvinceForm({ newProvince, setNewProvince, onCreateProvince }) {
  const { t } = useTranslation();

  return (
    <form className="panel form catalog-form" onSubmit={onCreateProvince}>
      <h3>{t("provinces.formTitle")}</h3>
      <p className="section-lead section-lead--tight">{t("provinces.formBlurb")}</p>
      <label className="form-label" htmlFor="province-name">
        {t("provinces.name")}
      </label>
      <input
        id="province-name"
        value={newProvince.name}
        onChange={(event) => setNewProvince({ ...newProvince, name: event.target.value })}
        placeholder={t("provinces.namePh")}
        required
        minLength={2}
      />
      <Button variant="primary" type="submit">
        {t("provinces.save")}
      </Button>
    </form>
  );
}
