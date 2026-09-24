export const XION_TELEGRAM_URL = "https://t.me/xion_office";

export const XION_ADDRESS =
  "Toshkent shahri, Olmazor tumani, Allon ko‘chasi 141A";

export const XION_POSITION = [41.346819, 69.214511];
export const XION_YANDEX_POSITION = [XION_POSITION[1], XION_POSITION[0]];

export const XION_MAP_URL = `https://www.google.com/maps?q=${XION_POSITION[0]},${XION_POSITION[1]}&ll=${XION_POSITION[0]},${XION_POSITION[1]}&z=16`;

export const outlookComposeUrl = (email) =>
  `ms-outlook://compose?to=${encodeURIComponent(email)}`;

export function openOutlookCompose(event, email) {
  event?.preventDefault?.();
  window.location.assign(outlookComposeUrl(email));
}
