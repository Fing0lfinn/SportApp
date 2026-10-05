export type Plate = { kg: number; color: string; height: number; width: number };

export const PLATES: Plate[] = [
  { kg: 25, color: '#E5484D', height: 150, width: 22 },
  { kg: 20, color: '#3E8BFF', height: 140, width: 20 },
  { kg: 15, color: '#F2C14E', height: 122, width: 18 },
  { kg: 10, color: '#3DD68C', height: 104, width: 16 },
  { kg: 5, color: '#F4F6F8', height: 78, width: 13 },
  { kg: 2.5, color: '#5A616C', height: 62, width: 11 },
  { kg: 1.25, color: '#B9C0CA', height: 50, width: 9 },
];

/** Bir taraf için en az plakayla yükleme. Tam denk gelmezse kalan kilo da döner. */
export function loadBar(total: number, bar: number) {
  const perSide = Math.max(0, (total - bar) / 2);
  let rest = perSide;
  const plates: Plate[] = [];
  for (const p of PLATES) {
    while (rest >= p.kg - 1e-9) {
      rest -= p.kg;
      plates.push(p);
    }
  }
  return { plates, perSide, loaded: total - rest * 2, exact: rest < 1e-9 };
}

/** "2 × 25 + 5" gibi özet */
export function plateSummary(plates: Plate[]) {
  const counts = new Map<number, number>();
  plates.forEach((p) => counts.set(p.kg, (counts.get(p.kg) ?? 0) + 1));
  return [...counts.entries()]
    .map(([kg, n]) => `${n > 1 ? `${n} × ` : ''}${String(kg).replace('.', ',')}`)
    .join(' + ');
}
