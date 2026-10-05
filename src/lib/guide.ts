import { strings, type Lang } from '@/i18n';
import { de } from '@/i18n/guides/de';
import { en } from '@/i18n/guides/en';
import { es } from '@/i18n/guides/es';
import { ja } from '@/i18n/guides/ja';
import { trGuides } from '@/i18n/guides/tr';

import type { Exercise } from './challenge';

export type Guide = { muscles: string[]; steps: string[]; mistakes: string[]; rule: string; video: string };

/** Form ipuçları ve "bu sayılır mı?" tartışmasını bitiren sayılma kuralları. */
const GUIDES: Record<Lang, Record<string, Guide>> = { tr: trGuides, en, ja, es, de };

/** Ayrıntılı rehberi olmayan hareketler için tipine göre genel kural ve video araması. */
export function guideFor(ex: Exercise, lang: Lang): { detailed: Guide | null; rule: string; video: string } {
  const detailed = ex.custom ? null : (GUIDES[lang][ex.key] ?? null);
  const t = strings().guide;
  return {
    detailed,
    rule: detailed?.rule ?? t.rules[ex.type],
    video: detailed?.video ?? `${ex.name} ${t.videoWord}`,
  };
}
