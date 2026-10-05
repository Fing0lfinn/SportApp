/** Final: 4 Ekim 2027, 20:00 Türkiye saati. */
export const FINAL_AT = new Date('2027-10-04T20:00:00+03:00');

export function isFinalOver(now = Date.now()) {
  return now >= FINAL_AT.getTime();
}

/** Finale kalan süre (gün, saat, dakika, saniye). */
export function countdown(now = Date.now()) {
  const ms = Math.max(0, FINAL_AT.getTime() - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    over: ms === 0,
  };
}

/** Final günü mü (ama henüz saat 20:00 olmadı)? */
export function isFinalDay(now = new Date()) {
  return now.getFullYear() === 2027 && now.getMonth() === 9 && now.getDate() === 4 && !isFinalOver(now.getTime());
}
