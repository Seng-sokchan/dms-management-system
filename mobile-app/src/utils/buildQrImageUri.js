export function buildQrImageUri(qrImageUrl, qrString) {
  if (qrImageUrl && String(qrImageUrl).trim()) return String(qrImageUrl).trim();
  if (qrString && String(qrString).trim()) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(String(qrString))}`;
  }
  return null;
}
