import { useTranslation } from "react-i18next";

export function ProducerForm({ newProducer, setNewProducer, onCreateProducer }) {
  const { t } = useTranslation();
  return (
    <form className="panel form" onSubmit={onCreateProducer}>
      <h3>{t("producers.formTitle")}</h3>
      <label className="form-label" htmlFor="producer-name">
        {t("producers.namePh")}
      </label>
      <input
        id="producer-name"
        value={newProducer.name}
        onChange={(event) => setNewProducer({ ...newProducer, name: event.target.value })}
        placeholder={t("producers.namePh")}
        required
      />
      <label className="form-label" htmlFor="producer-phone">
        {t("producers.phonePh")}
      </label>
      <input
        id="producer-phone"
        value={newProducer.phone}
        onChange={(event) => setNewProducer({ ...newProducer, phone: event.target.value })}
        placeholder={t("producers.phonePh")}
        required
      />
      <label className="form-label" htmlFor="producer-capacity-note">
        {t("producers.capacityPh")}
      </label>
      <input
        id="producer-capacity-note"
        value={newProducer.capacityNote}
        onChange={(event) => setNewProducer({ ...newProducer, capacityNote: event.target.value })}
        placeholder={t("producers.capacityPh")}
      />
      <button type="submit" className="btn-primary">
        {t("producers.save")}
      </button>
    </form>
  );
}

