import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ToggleRow } from '@/components/toggle-row';
import { Btn, Chips, Empty, Field, IconBtn, Segmented, Stepper, styles, Txt } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { useLang, useStrings } from '@/i18n';
import { fmt, todayISO } from '@/lib/challenge';
import { FOOD_BY_KEY, FOODS, foodName, macrosFor, searchFoods, type Food, type PortionUnit } from '@/lib/foods';
import {
  favoriteId,
  favoritesOf,
  useHealthSettings,
  useToggleFavorite,
  type CustomFood,
  type Favorite,
} from '@/lib/health';
import {
  itemName,
  SLOTS,
  sumItems,
  useDeleteMeal,
  useMeals,
  useRecentMeals,
  useSaveMeal,
  type MealItem,
  type Slot,
} from '@/lib/nutrition';

type Tab = 'search' | 'recent' | 'favorites' | 'manual';

const num = (s: string) => {
  const v = Number(s.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

function itemFromFood(food: Food, unit: PortionUnit | 'g', qty: number): MealItem {
  const portion = food.portions.find((p) => p.unit === unit);
  const grams = unit === 'g' ? qty : Math.round((portion?.g ?? 100) * qty);
  return { food: food.key, name: food.names.en, unit, qty, grams, ...macrosFor(food, grams) };
}

function itemFromCustom(c: CustomFood, qty = 1): MealItem {
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    name: c.name,
    unit: 'serving',
    qty,
    grams: 0,
    kcal: Math.round(c.kcal * qty),
    protein: r1(c.protein * qty),
    carbs: r1(c.carbs * qty),
    fat: r1(c.fat * qty),
  };
}

/** Öğün ekle / düzenle: yiyecek ara, porsiyonu seç, sepete ekle, kaydet. */
export default function MealScreen() {
  const params = useLocalSearchParams<{ slot?: string; day?: string; id?: string }>();
  const day = params.day || todayISO();
  const meals = useMeals(day);
  const existing = params.id ? meals.data?.find((m) => m.id === params.id) : undefined;
  if (params.id && meals.isLoading) return null;
  return (
    <MealEditor
      key={existing?.id ?? 'new'}
      day={day}
      id={existing?.id}
      initialSlot={(existing?.slot as Slot) ?? (SLOTS.includes(params.slot as Slot) ? (params.slot as Slot) : 'snack')}
      initialItems={existing?.items ?? []}
    />
  );
}

function MealEditor({
  day,
  id,
  initialSlot,
  initialItems,
}: {
  day: string;
  id?: string;
  initialSlot: Slot;
  initialItems: MealItem[];
}) {
  const t = useStrings();
  const n = t.nutrition;
  const lang = useLang();
  const save = useSaveMeal();
  const del = useDeleteMeal();
  const settings = useHealthSettings();
  const toggleFav = useToggleFavorite();
  const favorites = favoritesOf(settings.data);
  const favIds = new Set(favorites.map(favoriteId));

  const [slot, setSlot] = useState<Slot>(initialSlot);
  const [items, setItems] = useState<MealItem[]>(initialItems);
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ food: Food; unit: PortionUnit | 'g'; qty: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totals = sumItems(items);
  const addItem = (item: MealItem) => setItems((list) => [...list, item].slice(0, 50));
  const pick = (food: Food, unit?: PortionUnit | 'g', qty?: number) => {
    const u = unit ?? food.portions[0]?.unit ?? 'g';
    setPicked({ food, unit: u, qty: qty ?? (u === 'g' ? 100 : 1) });
  };

  const done = async () => {
    await save.mutateAsync({ id, day, slot, items, lang });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        {id ? n.editMeal : n.addMeal}
      </Txt>
      <Chips items={SLOTS.map((s) => ({ key: s, label: n.slots[s] }))} value={slot} onChange={setSlot} />

      {items.length ? (
        <View style={{ backgroundColor: C.surface2, borderRadius: 20, padding: 14, gap: 10 }}>
          {items.map((it, i) => (
            <View key={`${it.name}-${i}`} style={[styles.row, { gap: 10 }]}>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="bold" numberOfLines={1}>
                  {itemName(it, lang)}
                </Txt>
                <Txt size={13} color={C.sub}>
                  {amountText(it, n)} · {it.kcal} kcal · {fmt(it.protein)} g {n.proteinShort}
                </Txt>
              </View>
              <IconBtn
                name="close"
                label={n.remove}
                size={34}
                bg={C.surface3}
                color={C.sub}
                onPress={() => setItems((list) => list.filter((_, j) => j !== i))}
              />
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
            <Txt size={15} weight="extrabold">
              {n.mealLine(totals.kcal, fmt(totals.protein), fmt(totals.carbs), fmt(totals.fat))}
            </Txt>
          </View>
        </View>
      ) : null}

      {picked ? (
        <PortionPicker
          food={picked.food}
          unit={picked.unit}
          qty={picked.qty}
          onChange={(unit, qty) => setPicked({ ...picked, unit, qty })}
          onCancel={() => setPicked(null)}
          onAdd={() => {
            addItem(itemFromFood(picked.food, picked.unit, picked.qty));
            setPicked(null);
            setQuery('');
          }}
          favorite={favIds.has(favoriteId(picked.food.key))}
          onFavorite={() => toggleFav(picked.food.key)}
        />
      ) : (
        <>
          <Segmented
            items={[
              { key: 'search' as const, label: n.tabs.search },
              { key: 'recent' as const, label: n.tabs.recent },
              { key: 'favorites' as const, label: n.tabs.favorites },
              { key: 'manual' as const, label: n.tabs.manual },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === 'search' ? (
            <SearchTab query={query} setQuery={setQuery} onPick={(f) => pick(f)} favIds={favIds} onFavorite={toggleFav} />
          ) : null}
          {tab === 'recent' ? (
            <RecentTab
              onPickFood={pick}
              onAddItem={addItem}
              onAddMeal={(list) => setItems((cur) => [...cur, ...list].slice(0, 50))}
            />
          ) : null}
          {tab === 'favorites' ? (
            <FavoritesTab favorites={favorites} onPickFood={(f) => pick(f)} onAddItem={addItem} onFavorite={toggleFav} />
          ) : null}
          {tab === 'manual' ? <ManualTab onAdd={addItem} onFavorite={toggleFav} /> : null}
        </>
      )}

      {save.isError ? (
        <Txt size={14} color={C.danger}>
          {n.saveError}
        </Txt>
      ) : null}
      <Btn
        title={id ? t.common.save : n.saveMeal}
        icon="check"
        disabled={!items.length || !!picked}
        loading={save.isPending}
        onPress={() => done().catch(() => {})}
      />
      {id ? (
        <Btn
          kind={confirmDelete ? 'primary' : 'danger'}
          height={48}
          style={confirmDelete ? { backgroundColor: C.dangerFill } : undefined}
          icon="trash"
          title={confirmDelete ? n.deleteConfirm : n.deleteMeal}
          loading={del.isPending}
          onPress={async () => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            await del.mutateAsync(id);
            router.back();
          }}
        />
      ) : null}
      <Txt size={12} color={C.muted} style={{ lineHeight: 18 }}>
        {n.source}
      </Txt>
    </ScrollView>
  );
}

function amountText(it: MealItem, n: ReturnType<typeof useStrings>['nutrition']) {
  if (it.unit === 'g') return `${it.qty} g`;
  const unit = `${fmt(it.qty)} ${n.units[it.unit]}`;
  return it.grams ? `${unit} (${it.grams} g)` : unit;
}

// ---------------------------------------------------------------- porsiyon seçimi

function PortionPicker({
  food,
  unit,
  qty,
  onChange,
  onCancel,
  onAdd,
  favorite,
  onFavorite,
}: {
  food: Food;
  unit: PortionUnit | 'g';
  qty: number;
  onChange: (unit: PortionUnit | 'g', qty: number) => void;
  onCancel: () => void;
  onAdd: () => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const t = useStrings();
  const n = t.nutrition;
  const lang = useLang();
  const item = itemFromFood(food, unit, qty);
  const units: (PortionUnit | 'g')[] = [...food.portions.map((p) => p.unit), 'g'];
  // Adet, dilim, bardak gibi sayılan porsiyonlar 1'er; kase, tabak gibi olanlar yarımşar artar.
  const whole = ['piece', 'slice', 'glass', 'cup', 'can', 'tbsp', 'tsp'].includes(unit);
  const step = unit === 'g' ? 10 : whole ? 1 : 0.5;
  const min = unit === 'g' ? 5 : 0.5;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ backgroundColor: C.surface2, borderRadius: 22, padding: 16, gap: 14 }}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Txt size={20} weight="extrabold">
            {foodName(food, lang)}
          </Txt>
          <Txt size={13} color={C.sub}>
            {n.per100(food.kcal, fmt(food.protein))}
            {food.approx ? ` · ${n.approx}` : ''}
          </Txt>
        </View>
        <IconBtn
          name="star"
          label={favorite ? n.unfavorite : n.favorite}
          size={40}
          bg={favorite ? C.goldBg : C.surface2}
          color={favorite ? C.gold : C.sub}
          onPress={onFavorite}
        />
      </View>
      <Chips
        items={units.map((u) => {
          const g = food.portions.find((p) => p.unit === u)?.g;
          return { key: u, label: u === 'g' ? n.grams : `${n.units[u]} (${g} g)` };
        })}
        value={unit}
        onChange={(u) => onChange(u, u === 'g' ? 100 : 1)}
      />
      <Stepper
        title={n.amount}
        sub={unit === 'g' ? 'g' : n.units[unit]}
        value={fmt(qty)}
        onDec={() => onChange(unit, Math.max(min, Math.round((qty - step) * 10) / 10))}
        onInc={() => onChange(unit, Math.min(unit === 'g' ? 2000 : 20, Math.round((qty + step) * 10) / 10))}
      />
      <Txt size={16} weight="extrabold" style={{ textAlign: 'center' }}>
        {n.mealLine(item.kcal, fmt(item.protein), fmt(item.carbs), fmt(item.fat))}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn kind="secondary" title={n.cancel} height={50} style={{ flex: 1 }} onPress={onCancel} />
        <Btn title={n.addToMeal} icon="plus" height={50} style={{ flex: 1.4 }} onPress={onAdd} />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- sekmeler

function FoodRow({
  food,
  onPress,
  fav,
  onFavorite,
}: {
  food: Food;
  onPress: () => void;
  fav: boolean;
  onFavorite: () => void;
}) {
  const n = useStrings().nutrition;
  const lang = useLang();
  const p = food.portions[0];
  const sub = p
    ? `${n.units[p.unit]} (${p.g} g) · ${Math.round((food.kcal * p.g) / 100)} kcal`
    : `100 g · ${food.kcal} kcal`;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: C.surface2, borderRadius: 16, paddingVertical: 10, paddingLeft: 14, paddingRight: 8, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={{ flex: 1 }}>
        <Txt size={15} weight="bold" numberOfLines={1}>
          {foodName(food, lang)}
          {food.approx ? ' ≈' : ''}
        </Txt>
        <Txt size={13} color={C.sub}>
          {sub}
        </Txt>
      </View>
      <IconBtn
        name="star"
        label={fav ? n.unfavorite : n.favorite}
        size={36}
        bg="transparent"
        color={fav ? C.gold : C.muted}
        onPress={onFavorite}
      />
    </Pressable>
  );
}

function SearchTab({
  query,
  setQuery,
  onPick,
  favIds,
  onFavorite,
}: {
  query: string;
  setQuery: (q: string) => void;
  onPick: (f: Food) => void;
  favIds: Set<string>;
  onFavorite: (f: Favorite) => void;
}) {
  const n = useStrings().nutrition;
  const lang = useLang();
  const results = useMemo(() => searchFoods(query, lang), [query, lang]);
  const popular = useMemo(
    () => ['egg', 'bread_white', 'chicken_breast', 'rice', 'yogurt', 'banana', 'feta', 'lentil_soup'].map((k) => FOOD_BY_KEY[k]),
    [],
  );
  const list = query.trim() ? results : popular;

  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.row, { backgroundColor: C.surface2, borderRadius: 18, paddingHorizontal: 14, height: 54 }]}>
        <Icon name="search" size={20} color={C.sub} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={n.searchPlaceholder}
          placeholderTextColor="#7E8793"
          selectionColor={C.accent}
          autoCorrect={false}
          accessibilityLabel={n.searchPlaceholder}
          style={{ flex: 1, color: C.text, fontFamily: F.semibold, fontSize: 17, height: 54 }}
        />
        {query ? <IconBtn name="close" label={n.clear} size={32} bg={C.surface2} color={C.sub} onPress={() => setQuery('')} /> : null}
      </View>
      {!query.trim() ? (
        <Txt size={13} weight="bold" color={C.sub}>
          {n.popular(FOODS.length)}
        </Txt>
      ) : null}
      {query.trim() && !results.length ? <Empty title={n.noResults} text={n.noResultsText} /> : null}
      {list.map((f) => (
        <FoodRow key={f.key} food={f} onPress={() => onPick(f)} fav={favIds.has(favoriteId(f.key))} onFavorite={() => onFavorite(f.key)} />
      ))}
    </View>
  );
}

function RecentTab({
  onPickFood,
  onAddItem,
  onAddMeal,
}: {
  onPickFood: (f: Food, unit: PortionUnit | 'g', qty: number) => void;
  onAddItem: (i: MealItem) => void;
  onAddMeal: (items: MealItem[]) => void;
}) {
  const n = useStrings().nutrition;
  const lang = useLang();
  const recent = useRecentMeals();
  const { meals, items } = useMemo(() => {
    const seenMeals = new Set<string>();
    const seenItems = new Set<string>();
    const meals: { name: string; items: MealItem[]; kcal: number }[] = [];
    const items: MealItem[] = [];
    for (const m of recent.data) {
      if (!m.items.length) continue;
      const mk = m.items
        .map((i) => i.food ?? i.name)
        .sort()
        .join('|');
      if (m.items.length > 1 && !seenMeals.has(mk) && meals.length < 8) {
        seenMeals.add(mk);
        meals.push({ name: m.items.map((i) => itemName(i, lang)).join(', '), items: m.items, kcal: Math.round(m.kcal) });
      }
      for (const it of m.items) {
        const ik = it.food ?? `custom:${it.name.toLowerCase()}`;
        if (!seenItems.has(ik) && items.length < 25) {
          seenItems.add(ik);
          items.push(it);
        }
      }
    }
    return { meals, items };
  }, [recent.data, lang]);

  if (!meals.length && !items.length) return <Empty title={n.noRecent} text={n.noRecentText} />;

  return (
    <View style={{ gap: 8 }}>
      {meals.length ? (
        <Txt size={13} weight="bold" color={C.sub}>
          {n.recentMeals}
        </Txt>
      ) : null}
      {meals.map((m, i) => (
        <Pressable
          key={`m${i}`}
          accessibilityRole="button"
          onPress={() => onAddMeal(m.items)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: C.surface2, borderRadius: 16, padding: 12, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}>
          <View style={{ flex: 1 }}>
            <Txt size={15} weight="bold" numberOfLines={2}>
              {m.name}
            </Txt>
            <Txt size={13} color={C.sub}>
              {m.kcal} kcal
            </Txt>
          </View>
          <Icon name="plus" size={20} color={C.accent} stroke={2.8} />
        </Pressable>
      ))}
      {items.length ? (
        <Txt size={13} weight="bold" color={C.sub} style={{ marginTop: 6 }}>
          {n.recentFoods}
        </Txt>
      ) : null}
      {items.map((it, i) => {
        const food = it.food ? FOOD_BY_KEY[it.food] : undefined;
        return (
          <Pressable
            key={`i${i}`}
            accessibilityRole="button"
            onPress={() => (food ? onPickFood(food, it.unit, it.qty) : onAddItem({ ...it }))}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: C.surface2, borderRadius: 16, padding: 12, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="bold" numberOfLines={1}>
                {itemName(it, lang)}
              </Txt>
              <Txt size={13} color={C.sub}>
                {amountText(it, n)} · {it.kcal} kcal
              </Txt>
            </View>
            <Icon name="plus" size={20} color={C.accent} stroke={2.8} />
          </Pressable>
        );
      })}
    </View>
  );
}

function FavoritesTab({
  favorites,
  onPickFood,
  onAddItem,
  onFavorite,
}: {
  favorites: Favorite[];
  onPickFood: (f: Food) => void;
  onAddItem: (i: MealItem) => void;
  onFavorite: (f: Favorite) => void;
}) {
  const n = useStrings().nutrition;
  if (!favorites.length) return <Empty title={n.noFavorites} text={n.noFavoritesText} />;
  return (
    <View style={{ gap: 8 }}>
      {favorites.map((fav) => {
        if (typeof fav === 'string') {
          const food = FOOD_BY_KEY[fav];
          if (!food) return null;
          return <FoodRow key={fav} food={food} onPress={() => onPickFood(food)} fav onFavorite={() => onFavorite(fav)} />;
        }
        return (
          <Pressable
            key={favoriteId(fav)}
            accessibilityRole="button"
            onPress={() => onAddItem(itemFromCustom(fav))}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: C.surface2, borderRadius: 16, paddingVertical: 10, paddingLeft: 14, paddingRight: 8, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="bold" numberOfLines={1}>
                {fav.name}
              </Txt>
              <Txt size={13} color={C.sub}>
                {n.mealLine(Math.round(fav.kcal), fmt(fav.protein), fmt(fav.carbs), fmt(fav.fat))}
              </Txt>
            </View>
            <IconBtn name="star" label={n.unfavorite} size={36} bg="transparent" color={C.gold} onPress={() => onFavorite(fav)} />
          </Pressable>
        );
      })}
    </View>
  );
}

function ManualTab({
  onAdd,
  onFavorite,
}: {
  onAdd: (i: MealItem) => void;
  onFavorite: (f: Favorite, onlyAdd?: boolean) => void;
}) {
  const n = useStrings().nutrition;
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fav, setFav] = useState(false);
  const valid = !!name.trim() && num(kcal) > 0 && num(kcal) <= 10000;

  const numField = (label: string, value: string, set: (v: string) => void) => (
    <View style={{ flex: 1 }}>
      <Field
        label={label}
        value={value}
        onChangeText={(v) => set(v.replace(/[^0-9.,]/g, '').slice(0, 6))}
        keyboardType="decimal-pad"
        placeholder="0"
        style={{ backgroundColor: C.surface2 }}
      />
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <Txt size={14} color={C.sub} style={{ lineHeight: 20 }}>
        {n.manualHint}
      </Txt>
      <Field
        label={n.foodName}
        value={name}
        onChangeText={(v) => setName(v.slice(0, 40))}
        placeholder={n.foodNamePlaceholder}
        style={{ backgroundColor: C.surface2 }}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {numField('kcal', kcal, setKcal)}
        {numField(`${n.protein} (g)`, protein, setProtein)}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {numField(`${n.carbs} (g)`, carbs, setCarbs)}
        {numField(`${n.fat} (g)`, fat, setFat)}
      </View>
      <ToggleRow title={n.saveFavorite} value={fav} onChange={setFav} />
      <Btn
        title={n.addToMeal}
        icon="plus"
        disabled={!valid}
        onPress={() => {
          const c: CustomFood = {
            name: name.trim(),
            kcal: num(kcal),
            protein: Math.min(500, num(protein)),
            carbs: Math.min(1000, num(carbs)),
            fat: Math.min(500, num(fat)),
          };
          onAdd(itemFromCustom(c));
          if (fav) onFavorite(c, true);
          setName('');
          setKcal('');
          setProtein('');
          setCarbs('');
          setFat('');
          setFav(false);
        }}
      />
    </View>
  );
}
