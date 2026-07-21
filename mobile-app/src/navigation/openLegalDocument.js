import { LEGAL_DOCUMENT_ROUTE } from "./ProfileNavigator";

export function openLegalDocument(navigation, { url, title }) {
  navigation.navigate(LEGAL_DOCUMENT_ROUTE, { url, title });
}
