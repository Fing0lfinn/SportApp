import { dateFromIndex, TOTAL_DAYS } from './challenge';

/** Final: grubun 365. günü, akşam 20:00 (telefonun saatine göre). */
export function finalAt(start: string) {
  const d = dateFromIndex(TOTAL_DAYS, start);
  d.setHours(20, 0, 0, 0);
  return d;
}

export function isFinalOver(start: string, now = Date.now()) {
  return now >= finalAt(start).getTime();
}

/** Finale kalan süre (gün, saat, dakika, saniye). */
export function countdown(start: string, now = Date.now()) {
  const ms = Math.max(0, finalAt(start).getTime() - now);
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
export function isFinalDay(start: string, now = new Date()) {
  const f = finalAt(start);
  return (
    now.getFullYear() === f.getFullYear() &&
    now.getMonth() === f.getMonth() &&
    now.getDate() === f.getDate() &&
    !isFinalOver(start, now.getTime())
  );
}
