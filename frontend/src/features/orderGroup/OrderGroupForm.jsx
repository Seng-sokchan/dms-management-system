import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import "../catalog/CatalogForm.css";

export function OrderGroupForm({ newOrderGroup, setNewOrderGroup, onCreateOrderGroup }) {
  const { t } = useTranslation();

  return (
    <form className="panel form catalog-form" onSubmit={onCreateOrderGroup}>
      <h3>{t("orderGroups.formTitle")}</h3>
      <p className="section-lead section-lead--tight">{t("orderGroups.formBlurb")}</p>
      <label className="form-label" htmlFor="order-group-name">
        {t("orderGroups.labelName")}
      </label>
      <input
        id="order-group-name"
        value={newOrderGroup.name}
        onChange={(event) => setNewOrderGroup({ ...newOrderGroup, name: event.target.value })}
        placeholder={t("orderGroups.namePh")}
        required
        minLength={2}
      />
      <Button variant="primary" type="submit">
        {t("orderGroups.save")}
      </Button>
    </form>
  );
}
