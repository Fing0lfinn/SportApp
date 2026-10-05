import type { Guide } from '@/lib/guide';

export const trGuides: Record<string, Guide> = {
  squat: {
    muscles: ['Ön bacak', 'Kalça', 'Arka bacak', 'Karın'],
    steps: [
      'Barı omzunun arkasına, trapezin üstüne yerleştir. Ayaklar omuz genişliğinde, parmak uçları hafif dışa.',
      'Nefes al, karnını sık. Kalçayı geriye ve aşağı göndererek çömel.',
      'Dizler ayak parmaklarıyla aynı yöne baksın. Kalça en az diz hizasına insin.',
      'Topuklardan iterek, göğüs dik şekilde yukarı kalk.',
    ],
    mistakes: ['Dizlerin içe çökmesi', 'Topukların yerden kalkması', 'Yeterince derine inmemek'],
    rule: 'Hedef ağırlıkla en az 1 tam tekrar: kalça diz hizasına inmeli.',
    video: 'back squat doğru form',
  },
  deadlift: {
    muscles: ['Arka bacak', 'Kalça', 'Sırt', 'Kavrama'],
    steps: [
      'Bar ayak ortasının üstünde, ayaklar kalça genişliğinde.',
      'Eğil, barı omuz genişliğinde kavra. Kaval kemiklerin bara değsin.',
      'Göğsü kaldır, sırtı düz tut, karnını sık.',
      'Barı bacaklara yakın tutarak kalça ve dizleri birlikte aç, tepede kalçayı kilitle.',
    ],
    mistakes: ['Sırtın kamburlaşması', 'Barın vücuttan uzaklaşması', 'Tepede belden geriye yaslanmak'],
    rule: 'Hedef ağırlıkla en az 1 tekrar, tepede tam kilitlenerek.',
    video: 'deadlift doğru form',
  },
  bench: {
    muscles: ['Göğüs', 'Ön omuz', 'Arka kol'],
    steps: [
      'Gözlerin barın altında olacak şekilde yat, ayaklar yere basık.',
      'Kürek kemiklerini birbirine sıkıştır, barı omuzdan biraz geniş kavra.',
      'Barı kontrollü şekilde göğsünün alt kısmına indir.',
      'Dirsekler gövdeye yaklaşık 45° açıyla, barı yukarı it ve kolları aç.',
    ],
    mistakes: ['Dirsekleri tam yana açmak', 'Barı göğüsten sektirmek', 'Kalçayı sehpadan kaldırmak'],
    rule: 'Bar göğse değmeli, kollar tam açılmalı.',
    video: 'bench press doğru form',
  },
  ohp: {
    muscles: ['Omuz', 'Arka kol', 'Üst sırt', 'Karın'],
    steps: [
      'Barı köprücük kemiğinin üstünde, omuz genişliğinde kavra.',
      'Kalçanı ve karnını sık, belini fazla çukurlaştırma.',
      'Başını hafif geri çekip barı düz bir çizgide yukarı it.',
      'Bar başının üstüne gelince başını öne al, kolları kilitle.',
    ],
    mistakes: ['Belden fazla geriye yaslanmak', 'Bacaklarla itmek', 'Barı önden yay çizerek itmek'],
    rule: 'Ayakta, bacak yardımı olmadan, kollar tepede kilitli.',
    video: 'overhead press doğru form',
  },
  pushup: {
    muscles: ['Göğüs', 'Arka kol', 'Ön omuz', 'Karın'],
    steps: [
      'Eller omuz genişliğinden biraz geniş, vücut baştan topuğa düz.',
      'Karnını ve kalçanı sık.',
      'Göğsün yere yaklaşana kadar in, dirsekler 45° açıda.',
      'Avuçlarından iterek başlangıca dön, kolları tam aç.',
    ],
    mistakes: ['Kalçanın düşmesi ya da havaya kalkması', 'Yarım tekrar yapmak'],
    rule: 'Tek sette, ara vermeden. Göğüs yere yaklaşmalı, kollar tam açılmalı.',
    video: 'şınav doğru form',
  },
  pullup: {
    muscles: ['Kanat kası', 'Biceps', 'Ön kol', 'Üst sırt'],
    steps: [
      'Barı omuzdan biraz geniş, avuçlar öne bakacak şekilde kavra.',
      'Kollar tam açık asıl, omuzlarını aşağı çek.',
      'Göğsünü bara doğru çekerek çenen barı geçene kadar yüksel.',
      'Kontrollü in ve kolları tam aç.',
    ],
    mistakes: ['Bacaklarla sallanarak çıkmak', 'Altta kolları tam açmamak'],
    rule: 'Tam asılı başla, çene barı geçmeli, sallanma yok.',
    video: 'barfiks doğru form',
  },
  bulgarian: {
    muscles: ['Ön bacak', 'Kalça', 'Denge'],
    steps: [
      'Arka ayağının üstünü sehpaya koy, iki elinde dambıl.',
      'Ön ayağın sehpadan yaklaşık bir adım ileride olsun.',
      'Gövde dik, arka dizin yere yaklaşana kadar in.',
      'Ön topuğundan iterek kalk. İki bacakla da aynı tekrarı yap.',
    ],
    mistakes: ['Ön dizin içe kaçması', 'Ön ayağın sehpaya çok yakın durması'],
    rule: 'Her elde hedef ağırlıkta dambılla, iki bacakla da en az 1 tekrar.',
    video: 'bulgarian split squat form',
  },
  farmer: {
    muscles: ['Kavrama', 'Trapez', 'Karın', 'Bacak'],
    steps: [
      'Dambılları yerden düz sırtla, deadlift gibi kaldır.',
      'Omuzlar geride, göğüs dik, kollar gergin.',
      'Kısa ve hızlı adımlarla düz bir çizgide yürü.',
      'Mesafeyi bırakmadan tamamla, dambılları yine düz sırtla bırak.',
    ],
    mistakes: ['Omuzların öne düşmesi', 'Yana sallanarak yürümek'],
    rule: 'Her elde hedef ağırlıkla, hedef mesafe boyunca yere bırakmadan.',
    video: "farmer's walk form",
  },
  row: {
    muscles: ['Üst sırt', 'Kanat kası', 'Arka omuz', 'Biceps'],
    steps: [
      'Barı omuz genişliğinde kavra, dizlerin hafif bükülü.',
      'Kalçadan öne eğil. Gövde yere neredeyse paralel, sırt düz.',
      'Barı karnının üst kısmına çek, kürek kemiklerini sık.',
      'Kontrollü şekilde kolları aç.',
    ],
    mistakes: ['Gövdeyi kaldırarak hile yapmak', 'Sırtın yuvarlaklaşması'],
    rule: 'Gövde öne eğik kalarak, bar karna değene kadar en az 1 tekrar.',
    video: 'barbell bent over row form',
  },
};
