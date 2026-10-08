import type { Lang } from '@/i18n';

// Uygulamaya gömülü yiyecek listesi: 100 g (sıvılarda ~100 ml) başına kalori ve makrolar.
// Temel yiyecekler USDA FoodData Central (SR Legacy, kamu malı) referans değerlerine dayanır.
// "approx" işaretli olanlar (ev yemekleri, karışık yemekler) standart bir tariften hesaplanmış
// yaklaşık değerlerdir; tarife ve porsiyona göre değişir.

export type PortionUnit =
  | 'piece'
  | 'slice'
  | 'bowl'
  | 'plate'
  | 'glass'
  | 'cup'
  | 'can'
  | 'tbsp'
  | 'tsp'
  | 'handful'
  | 'serving';

export type Food = {
  key: string;
  /** tr, en, ja, es, de */
  names: Record<Lang, string>;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portions: { unit: PortionUnit; g: number }[];
  approx: boolean;
};

type Names = [tr: string, en: string, ja: string, es: string, de: string];
type Macros = [kcal: number, protein: number, carbs: number, fat: number];

function f(key: string, n: Names, m: Macros, portions: [PortionUnit, number][] = [], approx = false): Food {
  return {
    key,
    names: { tr: n[0], en: n[1], ja: n[2], es: n[3], de: n[4] },
    kcal: m[0],
    protein: m[1],
    carbs: m[2],
    fat: m[3],
    portions: portions.map(([unit, g]) => ({ unit, g })),
    approx,
  };
}

const A = true;

export const FOODS: Food[] = [
  // ---------------------------------------------------------------- yumurta ve süt ürünleri
  f('egg', ['Haşlanmış yumurta', 'Boiled egg', 'ゆで卵', 'Huevo cocido', 'Gekochtes Ei'], [155, 12.6, 1.1, 10.6], [['piece', 50]]),
  f('egg_fried', ['Sahanda yumurta', 'Fried egg', '目玉焼き', 'Huevo frito', 'Spiegelei'], [196, 13.6, 0.8, 14.8], [['piece', 46]]),
  f('omelette', ['Omlet', 'Omelette', 'オムレツ', 'Tortilla francesa', 'Omelett'], [154, 10.6, 0.6, 11.7], [['serving', 120]]),
  f('egg_white', ['Yumurta akı', 'Egg white', '卵白', 'Clara de huevo', 'Eiweiß'], [52, 10.9, 0.7, 0.2], [['piece', 33]]),
  f('menemen', ['Menemen', 'Menemen (eggs with tomato & pepper)', 'メネメン（トマト卵炒め）', 'Menemen (huevos con tomate)', 'Menemen (Eier mit Tomate)'], [100, 5.5, 5, 7], [['serving', 250]], A),
  f('milk_whole', ['Süt (tam yağlı)', 'Whole milk', '牛乳', 'Leche entera', 'Vollmilch'], [61, 3.2, 4.8, 3.3], [['glass', 200]]),
  f('milk_low', ['Süt (yarım yağlı)', 'Low-fat milk', '低脂肪乳', 'Leche semidesnatada', 'Fettarme Milch'], [50, 3.3, 4.8, 2], [['glass', 200]]),
  f('yogurt', ['Yoğurt', 'Plain yogurt', 'プレーンヨーグルト', 'Yogur natural', 'Naturjoghurt'], [61, 3.5, 4.7, 3.3], [['bowl', 150], ['tbsp', 20]]),
  f('greek_yogurt', ['Süzme yoğurt', 'Greek yogurt', 'ギリシャヨーグルト', 'Yogur griego', 'Griechischer Joghurt'], [73, 10, 3.9, 1.9], [['bowl', 150], ['tbsp', 20]]),
  f('ayran', ['Ayran', 'Ayran (yogurt drink)', 'アイラン（ヨーグルト飲料）', 'Ayran (bebida de yogur)', 'Ayran (Joghurtgetränk)'], [36, 1.7, 2.6, 2], [['glass', 200]], A),
  f('kefir', ['Kefir', 'Kefir', 'ケフィア', 'Kéfir', 'Kefir'], [41, 3.8, 4.5, 1], [['glass', 200]]),
  f('feta', ['Beyaz peynir', 'Feta cheese', 'フェタチーズ', 'Queso feta', 'Feta'], [264, 14.2, 4.1, 21.3], [['slice', 30]]),
  f('kasar', ['Kaşar peyniri', 'Kashkaval cheese', 'カシャルチーズ', 'Queso kashkaval', 'Kaşar-Käse'], [360, 25, 2, 28], [['slice', 25]], A),
  f('cheddar', ['Çedar peyniri', 'Cheddar', 'チェダーチーズ', 'Queso cheddar', 'Cheddar'], [403, 24.9, 1.3, 33.1], [['slice', 25]]),
  f('mozzarella', ['Mozzarella', 'Mozzarella', 'モッツァレラ', 'Mozzarella', 'Mozzarella'], [300, 22.2, 2.2, 22.4], [['slice', 25]]),
  f('cottage', ['Lor peyniri', 'Cottage cheese', 'カッテージチーズ', 'Requesón', 'Hüttenkäse'], [81, 10.5, 4.8, 2.3], [['tbsp', 30], ['bowl', 150]]),
  f('cream_cheese', ['Krem peynir', 'Cream cheese', 'クリームチーズ', 'Queso crema', 'Frischkäse'], [342, 5.9, 4.1, 34.2], [['tbsp', 15]]),
  f('butter', ['Tereyağı', 'Butter', 'バター', 'Mantequilla', 'Butter'], [717, 0.9, 0.1, 81.1], [['tbsp', 14], ['tsp', 5]]),

  // ---------------------------------------------------------------- ekmek, tahıl
  f('bread_white', ['Beyaz ekmek', 'White bread', '食パン', 'Pan blanco', 'Weißbrot'], [266, 7.6, 50.6, 3.3], [['slice', 25]]),
  f('bread_whole', ['Tam buğday ekmeği', 'Whole wheat bread', '全粒粉パン', 'Pan integral', 'Vollkornbrot'], [252, 12.4, 42.7, 3.5], [['slice', 30]]),
  f('simit', ['Simit', 'Simit (sesame bagel)', 'シミット（ごまパン）', 'Simit (rosca de sésamo)', 'Simit (Sesamkringel)'], [300, 9.5, 55, 4.5], [['piece', 100]], A),
  f('lavash', ['Lavaş', 'Flatbread (lavash)', 'ラヴァシュ', 'Pan lavash', 'Lavash-Fladenbrot'], [304, 8.1, 50.4, 7.7], [['piece', 60]]),
  f('pita', ['Pide ekmeği', 'Pita bread', 'ピタパン', 'Pan de pita', 'Pitabrot'], [275, 9.1, 55.7, 1.2], [['piece', 60]]),
  f('rice', ['Pirinç (haşlanmış)', 'White rice (cooked)', 'ご飯', 'Arroz blanco (cocido)', 'Reis (gekocht)'], [130, 2.7, 28.2, 0.3], [['bowl', 150], ['plate', 200]]),
  f('pilav', ['Pirinç pilavı', 'Rice pilaf', 'ピラフ', 'Arroz pilaf', 'Reispilaw'], [168, 2.9, 28, 4.6], [['plate', 200], ['tbsp', 25]], A),
  f('bulgur_pilav', ['Bulgur pilavı', 'Bulgur pilaf', 'ブルグルピラフ', 'Pilaf de bulgur', 'Bulgurpilaw'], [120, 3.2, 19, 3.5], [['plate', 200], ['tbsp', 25]], A),
  f('brown_rice', ['Esmer pirinç (haşlanmış)', 'Brown rice (cooked)', '玄米ご飯', 'Arroz integral (cocido)', 'Naturreis (gekocht)'], [123, 2.7, 25.6, 1], [['bowl', 150]]),
  f('pasta', ['Makarna (haşlanmış)', 'Pasta (cooked)', 'パスタ（ゆで）', 'Pasta (cocida)', 'Nudeln (gekocht)'], [158, 5.8, 30.9, 0.9], [['plate', 200]]),
  f('oats', ['Yulaf ezmesi', 'Rolled oats', 'オートミール（乾燥）', 'Copos de avena', 'Haferflocken'], [379, 13.2, 67.7, 6.5], [['tbsp', 10], ['serving', 40]]),
  f('oatmeal', ['Yulaf lapası', 'Oatmeal (cooked with water)', 'オートミール粥', 'Gachas de avena', 'Haferbrei'], [71, 2.5, 12, 1.5], [['bowl', 250]]),
  f('cornflakes', ['Mısır gevreği', 'Corn flakes', 'コーンフレーク', 'Copos de maíz', 'Cornflakes'], [357, 7.5, 84, 0.4], [['bowl', 30]]),
  f('granola', ['Granola', 'Granola', 'グラノーラ', 'Granola', 'Granola'], [471, 10, 64, 20], [['serving', 50]]),
  f('potato', ['Haşlanmış patates', 'Boiled potato', 'ゆでじゃがいも', 'Patata cocida', 'Salzkartoffel'], [87, 1.9, 20.1, 0.1], [['piece', 150]]),
  f('fries', ['Patates kızartması', 'French fries', 'フライドポテト', 'Patatas fritas', 'Pommes frites'], [312, 3.4, 41.4, 14.7], [['serving', 120]]),
  f('sweet_potato', ['Tatlı patates', 'Sweet potato (baked)', 'さつまいも', 'Boniato (asado)', 'Süßkartoffel'], [90, 2, 20.7, 0.2], [['piece', 130]]),
  f('quinoa', ['Kinoa (haşlanmış)', 'Quinoa (cooked)', 'キヌア（ゆで）', 'Quinoa (cocida)', 'Quinoa (gekocht)'], [120, 4.4, 21.3, 1.9], [['bowl', 150]]),
  f('couscous', ['Kuskus (haşlanmış)', 'Couscous (cooked)', 'クスクス', 'Cuscús (cocido)', 'Couscous (gekocht)'], [112, 3.8, 23.2, 0.2], [['bowl', 150]]),
  f('corn', ['Mısır (haşlanmış)', 'Corn on the cob', 'とうもろこし', 'Mazorca de maíz', 'Maiskolben'], [96, 3.4, 21, 1.5], [['piece', 100]]),

  // ---------------------------------------------------------------- et, tavuk, balık
  f('chicken_breast', ['Tavuk göğsü (ızgara)', 'Chicken breast (grilled)', '鶏むね肉（グリル）', 'Pechuga de pollo (a la plancha)', 'Hähnchenbrust (gegrillt)'], [165, 31, 0, 3.6], [['piece', 120], ['serving', 150]]),
  f('chicken_thigh', ['Tavuk but (derisiz)', 'Chicken thigh (skinless)', '鶏もも肉（皮なし）', 'Muslo de pollo (sin piel)', 'Hähnchenschenkel (ohne Haut)'], [209, 26, 0, 10.9], [['serving', 150]]),
  f('chicken_wing', ['Tavuk kanat', 'Chicken wings', '手羽先', 'Alitas de pollo', 'Chicken Wings'], [290, 26.9, 0, 19.5], [['piece', 35]]),
  f('chicken_doner', ['Tavuk döner', 'Chicken döner', 'チキンケバブ', 'Döner de pollo', 'Hähnchen-Döner'], [200, 22, 3, 11], [['serving', 150]], A),
  f('beef_doner', ['Et döner', 'Beef döner', 'ビーフケバブ', 'Döner de ternera', 'Rind-Döner'], [250, 20, 3, 18], [['serving', 150]], A),
  f('ground_beef', ['Kıyma (pişmiş)', 'Ground beef (cooked)', '牛ひき肉（加熱）', 'Carne picada (cocinada)', 'Rinderhack (gebraten)'], [272, 25.6, 0, 17.9], [['serving', 100]]),
  f('kofte', ['Izgara köfte', 'Grilled meatballs (köfte)', 'キョフテ（肉団子）', 'Albóndigas a la parrilla', 'Gegrillte Frikadellen (Köfte)'], [250, 18, 6, 17], [['piece', 30], ['serving', 150]], A),
  f('steak', ['Biftek (ızgara)', 'Beef steak (grilled)', 'ビーフステーキ', 'Filete de ternera', 'Rindersteak'], [250, 26, 0, 16], [['serving', 150]]),
  f('beef_cubes', ['Kuşbaşı et (pişmiş)', 'Beef cubes (cooked)', '牛角切り肉（加熱）', 'Dados de ternera (cocidos)', 'Rindfleischwürfel (gegart)'], [220, 28, 0, 12], [['serving', 120]], A),
  f('lamb', ['Kuzu eti (pişmiş)', 'Lamb (cooked)', 'ラム肉', 'Cordero (cocinado)', 'Lammfleisch (gegart)'], [294, 25.6, 0, 20.9], [['serving', 120]]),
  f('turkey_breast', ['Hindi göğsü', 'Turkey breast', '七面鳥むね肉', 'Pechuga de pavo', 'Putenbrust'], [147, 30.1, 0, 2.1], [['slice', 20], ['serving', 120]]),
  f('sucuk', ['Sucuk', 'Sucuk (spicy sausage)', 'スジュク（ソーセージ）', 'Sucuk (embutido picante)', 'Sucuk (Knoblauchwurst)'], [450, 20, 2, 40], [['slice', 10]], A),
  f('sausage', ['Sosis', 'Frankfurter', 'ソーセージ', 'Salchicha', 'Würstchen'], [290, 11, 3, 26], [['piece', 45]]),
  f('pastirma', ['Pastırma', 'Pastirma (cured beef)', 'パストゥルマ', 'Pastirma (cecina)', 'Pastırma (Dörrfleisch)'], [250, 30, 1, 14], [['slice', 10]], A),
  f('smoked_turkey', ['Hindi füme', 'Smoked turkey slices', 'スモークターキー', 'Pavo ahumado', 'Putenaufschnitt'], [124, 18, 3.8, 4], [['slice', 15]]),
  f('tuna_water', ['Ton balığı (suda)', 'Tuna (canned in water)', 'ツナ水煮', 'Atún al natural', 'Thunfisch (im eigenen Saft)'], [116, 25.5, 0, 0.8], [['can', 120]]),
  f('tuna_oil', ['Ton balığı (yağlı)', 'Tuna (canned in oil)', 'ツナ油漬け', 'Atún en aceite', 'Thunfisch in Öl'], [198, 29, 0, 8.2], [['can', 120]]),
  f('salmon', ['Somon', 'Salmon (cooked)', 'サーモン（加熱）', 'Salmón (cocinado)', 'Lachs (gegart)'], [206, 22.1, 0, 12.4], [['serving', 150]]),
  f('white_fish', ['Levrek / çipura', 'Sea bass / bream', 'スズキ・タイ', 'Lubina / dorada', 'Wolfsbarsch / Dorade'], [124, 23.6, 0, 2.6], [['serving', 150]]),
  f('anchovy_fried', ['Hamsi tava', 'Fried anchovies', 'カタクチイワシのフライ', 'Boquerones fritos', 'Frittierte Sardellen'], [250, 19, 8, 16], [['serving', 150]], A),
  f('shrimp', ['Karides', 'Shrimp (cooked)', 'エビ（加熱）', 'Gambas (cocidas)', 'Garnelen (gegart)'], [99, 24, 0.2, 0.3], [['serving', 100]]),
  f('sardines', ['Sardalya (konserve)', 'Sardines (canned in oil)', 'イワシ油漬け', 'Sardinas en aceite', 'Sardinen in Öl'], [208, 24.6, 0, 11.5], [['can', 90]]),

  // ---------------------------------------------------------------- baklagil ve ev yemekleri
  f('lentil_soup', ['Mercimek çorbası', 'Lentil soup', 'レンズ豆のスープ', 'Sopa de lentejas', 'Linsensuppe'], [70, 3.5, 10, 1.8], [['bowl', 250]], A),
  f('ezogelin', ['Ezogelin çorbası', 'Ezogelin soup', 'エゾゲリンスープ', 'Sopa ezogelin', 'Ezogelin-Suppe'], [75, 3.2, 11, 2], [['bowl', 250]], A),
  f('chicken_soup', ['Tavuk çorbası', 'Chicken soup', 'チキンスープ', 'Sopa de pollo', 'Hühnersuppe'], [45, 3, 5, 1.5], [['bowl', 250]], A),
  f('yayla_soup', ['Yayla çorbası', 'Yogurt soup', 'ヨーグルトスープ', 'Sopa de yogur', 'Joghurtsuppe'], [60, 2.5, 7, 2.5], [['bowl', 250]], A),
  f('tomato_soup', ['Domates çorbası', 'Tomato soup', 'トマトスープ', 'Sopa de tomate', 'Tomatensuppe'], [50, 1.2, 7, 2], [['bowl', 250]], A),
  f('kuru_fasulye', ['Kuru fasulye', 'White bean stew', '白いんげん豆の煮込み', 'Guiso de alubias', 'Weiße-Bohnen-Eintopf'], [110, 6, 15, 3], [['plate', 250]], A),
  f('chickpea_stew', ['Nohut yemeği', 'Chickpea stew', 'ひよこ豆の煮込み', 'Guiso de garbanzos', 'Kichererbseneintopf'], [120, 6, 16, 3.5], [['plate', 250]], A),
  f('chickpeas', ['Nohut (haşlanmış)', 'Chickpeas (boiled)', 'ひよこ豆（ゆで）', 'Garbanzos cocidos', 'Kichererbsen (gekocht)'], [164, 8.9, 27.4, 2.6], [['bowl', 150], ['tbsp', 15]]),
  f('lentils', ['Yeşil mercimek (haşlanmış)', 'Lentils (boiled)', 'レンズ豆（ゆで）', 'Lentejas cocidas', 'Linsen (gekocht)'], [116, 9, 20.1, 0.4], [['bowl', 150]]),
  f('kidney_beans', ['Barbunya (haşlanmış)', 'Kidney beans (boiled)', 'いんげん豆（ゆで）', 'Alubias rojas cocidas', 'Kidneybohnen (gekocht)'], [127, 8.7, 22.8, 0.5], [['bowl', 150]]),
  f('hummus', ['Humus', 'Hummus', 'フムス', 'Hummus', 'Hummus'], [166, 7.9, 14.3, 9.6], [['tbsp', 15]]),
  f('karniyarik', ['Karnıyarık', 'Stuffed eggplant (karnıyarık)', 'カルヌヤルク（茄子の肉詰め）', 'Berenjena rellena', 'Gefüllte Aubergine'], [130, 5, 8, 9], [['piece', 200]], A),
  f('imam_bayildi', ['İmam bayıldı', 'Imam bayildi', 'イマムバユルドゥ', 'Imam bayildi', 'Imam bayıldı'], [110, 1.5, 8, 8], [['piece', 200]], A),
  f('stuffed_pepper', ['Biber dolması (etli)', 'Stuffed peppers (with meat)', 'ピーマンの肉詰め', 'Pimientos rellenos de carne', 'Gefüllte Paprika (mit Fleisch)'], [150, 6, 15, 7], [['piece', 120]], A),
  f('sarma', ['Yaprak sarma', 'Stuffed vine leaves', 'ブドウの葉包み', 'Hojas de parra rellenas', 'Gefüllte Weinblätter'], [170, 2.5, 22, 8], [['piece', 25]], A),
  f('manti', ['Mantı', 'Manti (Turkish dumplings)', 'マントゥ（トルコ風水餃子）', 'Manti (raviolis turcos)', 'Mantı (türkische Teigtaschen)'], [180, 8, 22, 6.5], [['plate', 250]], A),
  f('lahmacun', ['Lahmacun', 'Lahmacun', 'ラフマジュン', 'Lahmacun', 'Lahmacun'], [240, 10, 32, 8], [['piece', 130]], A),
  f('pide', ['Kıymalı pide', 'Turkish pide (minced meat)', 'ピデ（ひき肉）', 'Pide turca de carne', 'Pide mit Hackfleisch'], [250, 11, 30, 9], [['serving', 250]], A),
  f('borek', ['Peynirli börek', 'Cheese börek', 'チーズのボレキ', 'Börek de queso', 'Käse-Börek'], [300, 9, 26, 18], [['slice', 100]], A),
  f('gozleme', ['Gözleme', 'Gözleme (stuffed flatbread)', 'ギョズレメ', 'Gözleme', 'Gözleme'], [250, 9, 30, 10], [['piece', 200]], A),
  f('iskender', ['İskender', 'Iskender kebab', 'イスケンデルケバブ', 'Kebab iskender', 'Iskender-Kebab'], [220, 13, 13, 13], [['plate', 350]], A),
  f('adana', ['Adana kebap', 'Adana kebab', 'アダナケバブ', 'Kebab adana', 'Adana-Kebab'], [280, 17, 2, 23], [['serving', 200]], A),
  f('chicken_shish', ['Tavuk şiş', 'Chicken shish', 'チキンシシカバブ', 'Brocheta de pollo', 'Hähnchenspieß'], [165, 25, 2, 6.5], [['serving', 200]], A),
  f('turlu', ['Türlü', 'Vegetable stew (türlü)', '野菜の煮込み', 'Guiso de verduras', 'Gemüseeintopf'], [80, 2, 8, 5], [['plate', 250]], A),
  f('green_beans', ['Zeytinyağlı taze fasulye', 'Green beans in olive oil', 'いんげんのオリーブオイル煮', 'Judías verdes en aceite', 'Grüne Bohnen in Olivenöl'], [75, 1.8, 7, 4.5], [['plate', 200]], A),
  f('spinach_dish', ['Ispanak yemeği', 'Spinach stew', 'ほうれん草の煮込み', 'Guiso de espinacas', 'Spinatgericht'], [70, 3, 5, 4.5], [['plate', 200]], A),
  f('cacik', ['Cacık', 'Cacık (yogurt & cucumber)', 'ジャジュク（ヨーグルトきゅうり）', 'Cacık (yogur y pepino)', 'Cacık (Joghurt mit Gurke)'], [40, 2, 3, 2], [['bowl', 150]], A),
  f('shepherd_salad', ['Çoban salata', 'Shepherd salad', '羊飼いのサラダ', 'Ensalada pastora', 'Hirtensalat'], [50, 0.9, 4, 3.5], [['bowl', 200]], A),
  f('green_salad', ['Yeşil salata (sossuz)', 'Green salad (no dressing)', 'グリーンサラダ', 'Ensalada verde (sin aliño)', 'Grüner Salat (ohne Dressing)'], [17, 1.2, 3.3, 0.2], [['bowl', 150]]),
  f('kisir', ['Kısır', 'Kısır (bulgur salad)', 'クスル（ブルグルサラダ）', 'Kısır (ensalada de bulgur)', 'Kısır (Bulgursalat)'], [150, 3, 22, 6], [['bowl', 150]], A),
  f('midye', ['Midye dolma', 'Stuffed mussels', 'ムール貝のピラフ詰め', 'Mejillones rellenos', 'Gefüllte Muscheln'], [200, 8, 25, 7], [['piece', 25]], A),
  f('toast', ['Kaşarlı tost', 'Cheese toastie', 'チーズトースト', 'Sándwich de queso', 'Käsetoast'], [300, 13, 30, 14], [['piece', 120]], A),
  f('hamburger', ['Hamburger', 'Hamburger', 'ハンバーガー', 'Hamburguesa', 'Hamburger'], [254, 13, 26, 11], [['piece', 200]], A),
  f('pizza', ['Pizza', 'Pizza', 'ピザ', 'Pizza', 'Pizza'], [266, 11.4, 33, 9.7], [['slice', 110]]),
  f('durum', ['Dürüm döner', 'Döner wrap', 'ドネルラップ', 'Dürüm (wrap de döner)', 'Dürüm Döner'], [240, 12, 24, 11], [['piece', 300]], A),

  // ---------------------------------------------------------------- sebze
  f('tomato', ['Domates', 'Tomato', 'トマト', 'Tomate', 'Tomate'], [18, 0.9, 3.9, 0.2], [['piece', 120]]),
  f('cucumber', ['Salatalık', 'Cucumber', 'きゅうり', 'Pepino', 'Gurke'], [15, 0.7, 3.6, 0.1], [['piece', 150]]),
  f('green_pepper', ['Yeşil biber', 'Green pepper', 'ピーマン', 'Pimiento verde', 'Grüne Paprika'], [20, 0.9, 4.6, 0.2], [['piece', 20]]),
  f('carrot', ['Havuç', 'Carrot', 'にんじん', 'Zanahoria', 'Karotte'], [41, 0.9, 9.6, 0.2], [['piece', 60]]),
  f('broccoli', ['Brokoli', 'Broccoli', 'ブロッコリー', 'Brócoli', 'Brokkoli'], [35, 2.4, 7.2, 0.4], [['bowl', 150]]),
  f('spinach', ['Ispanak (çiğ)', 'Spinach (raw)', 'ほうれん草（生）', 'Espinacas crudas', 'Spinat (roh)'], [23, 2.9, 3.6, 0.4], [['handful', 30]]),
  f('onion', ['Soğan', 'Onion', '玉ねぎ', 'Cebolla', 'Zwiebel'], [40, 1.1, 9.3, 0.1], [['piece', 110]]),
  f('eggplant', ['Patlıcan (fırın)', 'Eggplant (roasted)', 'なす（焼き）', 'Berenjena asada', 'Aubergine (gebacken)'], [35, 0.8, 8.7, 0.2], [['piece', 200]]),
  f('zucchini', ['Kabak', 'Zucchini', 'ズッキーニ', 'Calabacín', 'Zucchini'], [17, 1.2, 3.1, 0.3], [['piece', 200]]),
  f('mushroom', ['Mantar', 'Mushrooms', 'マッシュルーム', 'Champiñones', 'Champignons'], [22, 3.1, 3.3, 0.3], [['serving', 100]]),
  f('avocado', ['Avokado', 'Avocado', 'アボカド', 'Aguacate', 'Avocado'], [160, 2, 8.5, 14.7], [['piece', 140]]),
  f('black_olive', ['Siyah zeytin', 'Black olives', '黒オリーブ', 'Aceitunas negras', 'Schwarze Oliven'], [115, 0.8, 6.3, 10.7], [['piece', 4]]),
  f('green_olive', ['Yeşil zeytin', 'Green olives', 'グリーンオリーブ', 'Aceitunas verdes', 'Grüne Oliven'], [145, 1, 3.8, 15.3], [['piece', 4]]),

  // ---------------------------------------------------------------- meyve
  f('apple', ['Elma', 'Apple', 'りんご', 'Manzana', 'Apfel'], [52, 0.3, 13.8, 0.2], [['piece', 180]]),
  f('banana', ['Muz', 'Banana', 'バナナ', 'Plátano', 'Banane'], [89, 1.1, 22.8, 0.3], [['piece', 120]]),
  f('orange', ['Portakal', 'Orange', 'オレンジ', 'Naranja', 'Orange'], [47, 0.9, 11.8, 0.1], [['piece', 150]]),
  f('mandarin', ['Mandalina', 'Mandarin', 'みかん', 'Mandarina', 'Mandarine'], [53, 0.8, 13.3, 0.3], [['piece', 80]]),
  f('grapes', ['Üzüm', 'Grapes', 'ぶどう', 'Uvas', 'Weintrauben'], [69, 0.7, 18.1, 0.2], [['handful', 80], ['bowl', 150]]),
  f('strawberry', ['Çilek', 'Strawberries', 'いちご', 'Fresas', 'Erdbeeren'], [32, 0.7, 7.7, 0.3], [['bowl', 150]]),
  f('watermelon', ['Karpuz', 'Watermelon', 'すいか', 'Sandía', 'Wassermelone'], [30, 0.6, 7.6, 0.2], [['slice', 300]]),
  f('melon', ['Kavun', 'Melon', 'メロン', 'Melón', 'Honigmelone'], [34, 0.8, 8.2, 0.2], [['slice', 200]]),
  f('pear', ['Armut', 'Pear', '洋なし', 'Pera', 'Birne'], [57, 0.4, 15.2, 0.1], [['piece', 180]]),
  f('peach', ['Şeftali', 'Peach', '桃', 'Melocotón', 'Pfirsich'], [39, 0.9, 9.5, 0.3], [['piece', 150]]),
  f('cherries', ['Kiraz', 'Cherries', 'さくらんぼ', 'Cerezas', 'Kirschen'], [63, 1.1, 16, 0.2], [['bowl', 150]]),
  f('kiwi', ['Kivi', 'Kiwi', 'キウイ', 'Kiwi', 'Kiwi'], [61, 1.1, 14.7, 0.5], [['piece', 75]]),
  f('pomegranate', ['Nar', 'Pomegranate', 'ざくろ', 'Granada', 'Granatapfel'], [83, 1.7, 18.7, 1.2], [['piece', 150]]),
  f('dried_apricot', ['Kuru kayısı', 'Dried apricots', '干しあんず', 'Orejones', 'Getrocknete Aprikosen'], [241, 3.4, 62.6, 0.5], [['piece', 8]]),
  f('dates', ['Hurma', 'Dates', 'デーツ', 'Dátiles', 'Datteln'], [282, 2.5, 75, 0.4], [['piece', 10]]),
  f('dried_fig', ['Kuru incir', 'Dried figs', '干しいちじく', 'Higos secos', 'Getrocknete Feigen'], [249, 3.3, 63.9, 0.9], [['piece', 20]]),
  f('raisins', ['Kuru üzüm', 'Raisins', 'レーズン', 'Pasas', 'Rosinen'], [299, 3.1, 79.2, 0.5], [['tbsp', 10], ['handful', 30]]),

  // ---------------------------------------------------------------- kuruyemiş, yağ, sürülebilir
  f('almonds', ['Badem', 'Almonds', 'アーモンド', 'Almendras', 'Mandeln'], [579, 21.2, 21.6, 49.9], [['handful', 30], ['piece', 1.2]]),
  f('walnuts', ['Ceviz', 'Walnuts', 'くるみ', 'Nueces', 'Walnüsse'], [654, 15.2, 13.7, 65.2], [['handful', 30], ['piece', 5]]),
  f('hazelnuts', ['Fındık', 'Hazelnuts', 'ヘーゼルナッツ', 'Avellanas', 'Haselnüsse'], [628, 15, 16.7, 60.8], [['handful', 30]]),
  f('pistachios', ['Antep fıstığı', 'Pistachios', 'ピスタチオ', 'Pistachos', 'Pistazien'], [560, 20.2, 27.2, 45.3], [['handful', 30]]),
  f('peanuts', ['Yer fıstığı', 'Peanuts (roasted)', 'ピーナッツ', 'Cacahuetes tostados', 'Erdnüsse (geröstet)'], [585, 24, 21.5, 49.7], [['handful', 30]]),
  f('cashews', ['Kaju', 'Cashews', 'カシューナッツ', 'Anacardos', 'Cashewkerne'], [553, 18.2, 30.2, 43.9], [['handful', 30]]),
  f('sunflower_seeds', ['Ay çekirdeği (iç)', 'Sunflower seeds', 'ひまわりの種', 'Pipas de girasol', 'Sonnenblumenkerne'], [584, 20.8, 20, 51.5], [['handful', 30]]),
  f('peanut_butter', ['Fıstık ezmesi', 'Peanut butter', 'ピーナッツバター', 'Crema de cacahuete', 'Erdnussbutter'], [588, 25, 20, 50], [['tbsp', 16]]),
  f('tahini', ['Tahin', 'Tahini', 'タヒニ（ごまペースト）', 'Tahini', 'Tahini'], [595, 17, 21.2, 53.8], [['tbsp', 15]]),
  f('pekmez', ['Pekmez', 'Grape molasses', 'ぶどう糖蜜', 'Melaza de uva', 'Traubensirup'], [290, 0.5, 73, 0], [['tbsp', 20]], A),
  f('honey', ['Bal', 'Honey', 'はちみつ', 'Miel', 'Honig'], [304, 0.3, 82.4, 0], [['tbsp', 21], ['tsp', 7]]),
  f('jam', ['Reçel', 'Jam', 'ジャム', 'Mermelada', 'Marmelade'], [278, 0.4, 68.9, 0.1], [['tbsp', 20]]),
  f('sugar', ['Şeker', 'Sugar', '砂糖', 'Azúcar', 'Zucker'], [387, 0, 100, 0], [['tsp', 4], ['piece', 3]]),
  f('olive_oil', ['Zeytinyağı', 'Olive oil', 'オリーブオイル', 'Aceite de oliva', 'Olivenöl'], [884, 0, 0, 100], [['tbsp', 14], ['tsp', 5]]),
  f('sunflower_oil', ['Ayçiçek yağı', 'Sunflower oil', 'ひまわり油', 'Aceite de girasol', 'Sonnenblumenöl'], [884, 0, 0, 100], [['tbsp', 14], ['tsp', 5]]),
  f('choc_spread', ['Fındık kreması', 'Chocolate hazelnut spread', 'チョコヘーゼルナッツスプレッド', 'Crema de cacao y avellanas', 'Nuss-Nougat-Creme'], [539, 6.3, 57.5, 30.9], [['tbsp', 20]]),

  // ---------------------------------------------------------------- atıştırmalık, tatlı
  f('dark_chocolate', ['Bitter çikolata', 'Dark chocolate', 'ダークチョコレート', 'Chocolate negro', 'Zartbitterschokolade'], [598, 7.8, 45.9, 42.6], [['piece', 10]]),
  f('milk_chocolate', ['Sütlü çikolata', 'Milk chocolate', 'ミルクチョコレート', 'Chocolate con leche', 'Milchschokolade'], [535, 7.7, 59.4, 29.7], [['piece', 10]]),
  f('baklava', ['Baklava', 'Baklava', 'バクラヴァ', 'Baklava', 'Baklava'], [430, 6.5, 47, 24], [['piece', 40]], A),
  f('rice_pudding', ['Sütlaç', 'Rice pudding', 'ライスプディング', 'Arroz con leche', 'Milchreis'], [122, 3.6, 19.6, 3.2], [['bowl', 180]]),
  f('kunefe', ['Künefe', 'Künefe', 'キュネフェ', 'Künefe', 'Künefe'], [340, 8, 40, 17], [['serving', 150]], A),
  f('ice_cream', ['Dondurma', 'Ice cream', 'アイスクリーム', 'Helado', 'Eiscreme'], [207, 3.5, 23.6, 11], [['piece', 65]]),
  f('biscuit', ['Bisküvi', 'Biscuits', 'ビスケット', 'Galletas', 'Kekse'], [470, 7, 70, 18], [['piece', 8]], A),
  f('cake', ['Kek', 'Cake', 'パウンドケーキ', 'Bizcocho', 'Rührkuchen'], [380, 5.5, 52, 17], [['slice', 70]], A),
  f('chips', ['Cips', 'Potato chips', 'ポテトチップス', 'Patatas chips', 'Kartoffelchips'], [536, 7, 52.9, 34.6], [['serving', 30]]),
  f('popcorn', ['Patlamış mısır', 'Popcorn (air-popped)', 'ポップコーン', 'Palomitas', 'Popcorn'], [387, 13, 78, 4.5], [['serving', 25]]),
  f('protein_powder', ['Protein tozu', 'Protein powder (whey)', 'プロテインパウダー', 'Proteína en polvo', 'Proteinpulver'], [400, 80, 8, 6], [['serving', 30]], A),
  f('protein_bar', ['Protein bar', 'Protein bar', 'プロテインバー', 'Barrita de proteínas', 'Proteinriegel'], [350, 30, 35, 10], [['piece', 60]], A),

  // ---------------------------------------------------------------- içecek
  f('tea', ['Çay (şekersiz)', 'Tea (unsweetened)', '紅茶（無糖）', 'Té (sin azúcar)', 'Tee (ungesüßt)'], [1, 0, 0.3, 0], [['glass', 100]]),
  f('turkish_coffee', ['Türk kahvesi (şekersiz)', 'Turkish coffee (unsweetened)', 'トルココーヒー（無糖）', 'Café turco (sin azúcar)', 'Türkischer Kaffee (ungesüßt)'], [14, 0.4, 1.5, 0.6], [['cup', 70]], A),
  f('coffee', ['Filtre kahve', 'Black coffee', 'ブラックコーヒー', 'Café solo', 'Schwarzer Kaffee'], [1, 0.1, 0, 0], [['cup', 240]]),
  f('latte', ['Latte', 'Latte', 'カフェラテ', 'Café con leche', 'Latte macchiato'], [54, 3.2, 4.8, 2.4], [['cup', 350]], A),
  f('orange_juice', ['Portakal suyu', 'Orange juice', 'オレンジジュース', 'Zumo de naranja', 'Orangensaft'], [45, 0.7, 10.4, 0.2], [['glass', 200]]),
  f('cola', ['Kola', 'Cola', 'コーラ', 'Refresco de cola', 'Cola'], [42, 0, 10.6, 0], [['can', 330], ['glass', 200]]),
  f('beer', ['Bira', 'Beer', 'ビール', 'Cerveza', 'Bier'], [43, 0.5, 3.6, 0], [['can', 330], ['glass', 500]]),
  f('wine', ['Şarap', 'Wine', 'ワイン', 'Vino', 'Wein'], [85, 0.1, 2.6, 0], [['glass', 150]]),
];

export const FOOD_BY_KEY: Record<string, Food> = Object.fromEntries(FOODS.map((x) => [x.key, x]));

export function foodName(food: Food, lang: Lang) {
  return food.names[lang] || food.names.en;
}

/** Arama için: küçük harf, Türkçe ve aksanlı harfler sadeleştirilmiş. */
export function normalize(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const INDEX = FOODS.map((food) => ({
  food,
  all: Object.values(food.names).map(normalize),
}));

/** Telefonda arama: önce seçili dilde baştan eşleşenler, sonra herhangi bir dilde geçenler. */
export function searchFoods(query: string, lang: Lang, limit = 40): Food[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { food: Food; score: number }[] = [];
  for (const { food, all } of INDEX) {
    const own = normalize(foodName(food, lang));
    let score = -1;
    if (own.startsWith(q)) score = 0;
    else if (own.split(/[\s(/-]+/).some((w) => w.startsWith(q))) score = 1;
    else if (own.includes(q)) score = 2;
    else if (all.some((n) => n.includes(q))) score = 3;
    if (score >= 0) scored.push({ food, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || foodName(a.food, lang).localeCompare(foodName(b.food, lang)))
    .slice(0, limit)
    .map((s) => s.food);
}

/** Bir yiyeceğin verilen gramdaki değerleri (bir ondalık). */
export function macrosFor(food: Pick<Food, 'kcal' | 'protein' | 'carbs' | 'fat'>, grams: number) {
  const k = grams / 100;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    kcal: Math.round(food.kcal * k),
    protein: r1(food.protein * k),
    carbs: r1(food.carbs * k),
    fat: r1(food.fat * k),
  };
}
