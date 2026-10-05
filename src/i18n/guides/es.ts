import type { Guide } from '@/lib/guide';

export const es: Record<string, Guide> = {
  squat: {
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    steps: [
      'Coloca la barra en la parte alta de la espalda, sobre los trapecios. Pies al ancho de los hombros, puntas algo hacia fuera.',
      'Coge aire y aprieta el abdomen. Baja llevando la cadera hacia atrás y abajo.',
      'Las rodillas siguen la dirección de los pies. La cadera debe bajar al menos a la altura de las rodillas.',
      'Sube empujando con los talones, con el pecho erguido.',
    ],
    mistakes: ['Rodillas hacia dentro', 'Levantar los talones', 'No bajar lo suficiente'],
    rule: 'Al menos 1 repetición completa con el peso objetivo: la cadera debe llegar a la altura de las rodillas.',
    video: 'sentadilla técnica correcta',
  },
  deadlift: {
    muscles: ['Isquiotibiales', 'Glúteos', 'Espalda', 'Agarre'],
    steps: [
      'La barra sobre el centro del pie, pies al ancho de la cadera.',
      'Agáchate y agarra la barra un poco más ancho que los hombros. Las espinillas tocan la barra.',
      'Saca pecho, mantén la espalda recta y aprieta el abdomen.',
      'Con la barra pegada a las piernas, extiende cadera y rodillas a la vez y bloquea la cadera arriba.',
    ],
    mistakes: ['Encorvar la espalda', 'Alejar la barra del cuerpo', 'Echarse hacia atrás arriba'],
    rule: 'Al menos 1 repetición con el peso objetivo y bloqueo completo arriba.',
    video: 'peso muerto técnica correcta',
  },
  bench: {
    muscles: ['Pecho', 'Hombro anterior', 'Tríceps'],
    steps: [
      'Túmbate con los ojos bajo la barra y los pies apoyados en el suelo.',
      'Junta las escápulas y agarra la barra un poco más ancho que los hombros.',
      'Baja la barra con control hasta la parte baja del pecho.',
      'Con los codos a unos 45° del cuerpo, empuja la barra hasta estirar los brazos.',
    ],
    mistakes: ['Abrir los codos del todo', 'Rebotar la barra en el pecho', 'Levantar la cadera del banco'],
    rule: 'La barra debe tocar el pecho y los brazos deben estirarse por completo.',
    video: 'press de banca técnica correcta',
  },
  ohp: {
    muscles: ['Hombros', 'Tríceps', 'Espalda alta', 'Core'],
    steps: [
      'Sujeta la barra sobre las clavículas, manos al ancho de los hombros.',
      'Aprieta glúteos y abdomen, sin arquear demasiado la zona lumbar.',
      'Echa la cabeza un poco atrás y empuja la barra en línea recta hacia arriba.',
      'Cuando la barra pase la cabeza, adelanta la cabeza y bloquea los brazos.',
    ],
    mistakes: ['Inclinarse demasiado hacia atrás', 'Ayudarse con las piernas', 'Empujar la barra en arco por delante'],
    rule: 'De pie, sin impulso de piernas, con los brazos bloqueados arriba.',
    video: 'press militar técnica correcta',
  },
  pushup: {
    muscles: ['Pecho', 'Tríceps', 'Hombro anterior', 'Core'],
    steps: [
      'Manos un poco más anchas que los hombros, cuerpo recto de la cabeza a los talones.',
      'Aprieta abdomen y glúteos.',
      'Baja hasta que el pecho quede cerca del suelo, codos a unos 45°.',
      'Empuja con las palmas hasta volver al inicio y estira los brazos del todo.',
    ],
    mistakes: ['Cadera caída o demasiado alta', 'Hacer medias repeticiones'],
    rule: 'En una sola serie, sin descanso. El pecho cerca del suelo y los brazos completamente estirados.',
    video: 'flexiones técnica correcta',
  },
  pullup: {
    muscles: ['Dorsales', 'Bíceps', 'Antebrazos', 'Espalda alta'],
    steps: [
      'Agarra la barra un poco más ancho que los hombros, palmas hacia delante.',
      'Cuélgate con los brazos estirados y baja los hombros.',
      'Lleva el pecho hacia la barra hasta que la barbilla la supere.',
      'Baja con control y estira los brazos del todo.',
    ],
    mistakes: ['Balancearse con las piernas', 'No estirar los brazos abajo'],
    rule: 'Empieza colgado del todo, la barbilla supera la barra, sin balanceo.',
    video: 'dominadas técnica correcta',
  },
  bulgarian: {
    muscles: ['Cuádriceps', 'Glúteos', 'Equilibrio'],
    steps: [
      'Apoya el empeine del pie trasero en un banco, con una mancuerna en cada mano.',
      'El pie delantero, a un paso aproximado del banco.',
      'Con el tronco erguido, baja hasta que la rodilla trasera se acerque al suelo.',
      'Sube empujando con el talón delantero. Haz las mismas repeticiones con ambas piernas.',
    ],
    mistakes: ['La rodilla delantera se va hacia dentro', 'El pie delantero demasiado cerca del banco'],
    rule: 'Con una mancuerna del peso objetivo en cada mano, al menos 1 repetición con cada pierna.',
    video: 'sentadilla búlgara técnica',
  },
  farmer: {
    muscles: ['Agarre', 'Trapecios', 'Core', 'Piernas'],
    steps: [
      'Levanta las mancuernas del suelo con la espalda recta, como en un peso muerto.',
      'Hombros atrás, pecho arriba, brazos estirados.',
      'Camina en línea recta con pasos cortos y rápidos.',
      'Completa la distancia sin soltarlas y déjalas en el suelo con la espalda recta.',
    ],
    mistakes: ['Hombros caídos hacia delante', 'Balancearse de lado a lado'],
    rule: 'Con el peso objetivo en cada mano, toda la distancia objetivo sin soltarlo.',
    video: 'paseo del granjero técnica',
  },
  row: {
    muscles: ['Espalda alta', 'Dorsales', 'Hombro posterior', 'Bíceps'],
    steps: [
      'Agarra la barra al ancho de los hombros, rodillas un poco flexionadas.',
      'Inclínate desde la cadera hasta que el tronco quede casi paralelo al suelo, espalda recta.',
      'Lleva la barra a la parte alta del abdomen y junta las escápulas.',
      'Baja con control hasta estirar los brazos.',
    ],
    mistakes: ['Hacer trampa incorporándose', 'Encorvar la espalda'],
    rule: 'Al menos 1 repetición con el tronco inclinado, la barra tocando el abdomen.',
    video: 'remo con barra técnica correcta',
  },
};
