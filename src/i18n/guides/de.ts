import type { Guide } from '@/lib/guide';

export const de: Record<string, Guide> = {
  squat: {
    muscles: ['Oberschenkel vorne', 'Gesäß', 'Oberschenkel hinten', 'Rumpf'],
    steps: [
      'Lege die Stange auf den oberen Rücken, auf den Trapezmuskel. Füße schulterbreit, Fußspitzen leicht nach außen.',
      'Atme ein und spanne den Bauch an. Schiebe die Hüfte nach hinten unten und geh in die Hocke.',
      'Die Knie zeigen in Richtung der Zehen. Die Hüfte muss mindestens auf Kniehöhe sinken.',
      'Drück dich über die Fersen hoch, die Brust bleibt aufrecht.',
    ],
    mistakes: ['Knie fallen nach innen', 'Fersen heben ab', 'Nicht tief genug'],
    rule: 'Mindestens 1 vollständige Wiederholung mit dem Zielgewicht: Hüfte bis auf Kniehöhe.',
    video: 'Kniebeuge richtige Technik',
  },
  deadlift: {
    muscles: ['Oberschenkel hinten', 'Gesäß', 'Rücken', 'Griffkraft'],
    steps: [
      'Die Stange über der Fußmitte, Füße hüftbreit.',
      'Beug dich runter und greif die Stange etwas breiter als schulterbreit. Die Schienbeine berühren die Stange.',
      'Brust raus, Rücken gerade, Bauch anspannen.',
      'Führe die Stange nah an den Beinen, strecke Hüfte und Knie gleichzeitig und schließe oben die Hüfte.',
    ],
    mistakes: ['Runder Rücken', 'Stange entfernt sich vom Körper', 'Oben nach hinten lehnen'],
    rule: 'Mindestens 1 Wiederholung mit dem Zielgewicht, oben komplett gestreckt.',
    video: 'Kreuzheben richtige Technik',
  },
  bench: {
    muscles: ['Brust', 'Vordere Schulter', 'Trizeps'],
    steps: [
      'Leg dich so hin, dass deine Augen unter der Stange sind, Füße fest am Boden.',
      'Zieh die Schulterblätter zusammen und greif die Stange etwas breiter als schulterbreit.',
      'Senke die Stange kontrolliert zur unteren Brust.',
      'Mit den Ellbogen etwa 45° zum Körper drückst du die Stange hoch, bis die Arme gestreckt sind.',
    ],
    mistakes: ['Ellbogen ganz zur Seite', 'Stange von der Brust abfedern', 'Hüfte von der Bank heben'],
    rule: 'Die Stange muss die Brust berühren und die Arme müssen voll gestreckt sein.',
    video: 'Bankdrücken richtige Technik',
  },
  ohp: {
    muscles: ['Schultern', 'Trizeps', 'Oberer Rücken', 'Rumpf'],
    steps: [
      'Halte die Stange auf Höhe der Schlüsselbeine, Hände schulterbreit.',
      'Spanne Gesäß und Bauch an, kein Hohlkreuz.',
      'Nimm den Kopf leicht zurück und drück die Stange gerade nach oben.',
      'Sobald die Stange über dem Kopf ist, bring den Kopf nach vorne und streck die Arme durch.',
    ],
    mistakes: ['Zu weit nach hinten lehnen', 'Schwung aus den Beinen', 'Stange im Bogen vor dem Körper'],
    rule: 'Im Stand, ohne Beinschwung, Arme oben durchgestreckt.',
    video: 'Schulterdrücken richtige Technik',
  },
  pushup: {
    muscles: ['Brust', 'Trizeps', 'Vordere Schulter', 'Rumpf'],
    steps: [
      'Hände etwas breiter als schulterbreit, Körper vom Kopf bis zu den Fersen gerade.',
      'Spanne Bauch und Gesäß an.',
      'Geh runter, bis die Brust knapp über dem Boden ist, Ellbogen etwa 45°.',
      'Drück dich mit den Handflächen zurück nach oben und streck die Arme ganz durch.',
    ],
    mistakes: ['Hüfte hängt durch oder ist zu hoch', 'Halbe Wiederholungen'],
    rule: 'In einem Satz ohne Pause. Brust knapp über dem Boden, Arme voll gestreckt.',
    video: 'Liegestütze richtige Technik',
  },
  pullup: {
    muscles: ['Breiter Rückenmuskel', 'Bizeps', 'Unterarme', 'Oberer Rücken'],
    steps: [
      'Greif die Stange etwas breiter als schulterbreit, Handflächen nach vorne.',
      'Häng mit gestreckten Armen und zieh die Schultern nach unten.',
      'Zieh die Brust zur Stange, bis das Kinn darüber ist.',
      'Lass dich kontrolliert ab und streck die Arme ganz durch.',
    ],
    mistakes: ['Schwung aus den Beinen', 'Unten die Arme nicht ganz strecken'],
    rule: 'Aus dem toten Hang starten, Kinn über die Stange, kein Schwung.',
    video: 'Klimmzüge richtige Technik',
  },
  bulgarian: {
    muscles: ['Oberschenkel vorne', 'Gesäß', 'Gleichgewicht'],
    steps: [
      'Leg den Fußrücken des hinteren Fußes auf eine Bank, in jeder Hand eine Kurzhantel.',
      'Der vordere Fuß steht etwa einen Schritt vor der Bank.',
      'Oberkörper aufrecht, senk dich ab, bis das hintere Knie fast den Boden berührt.',
      'Drück dich über die vordere Ferse hoch. Gleich viele Wiederholungen mit beiden Beinen.',
    ],
    mistakes: ['Vorderes Knie fällt nach innen', 'Vorderer Fuß zu nah an der Bank'],
    rule: 'Mit einer Kurzhantel im Zielgewicht in jeder Hand, mindestens 1 Wiederholung pro Bein.',
    video: 'Bulgarische Kniebeuge Technik',
  },
  farmer: {
    muscles: ['Griffkraft', 'Trapezmuskel', 'Rumpf', 'Beine'],
    steps: [
      'Heb die Kurzhanteln mit geradem Rücken vom Boden, wie beim Kreuzheben.',
      'Schultern zurück, Brust raus, Arme lang.',
      'Geh mit kurzen, schnellen Schritten geradeaus.',
      'Bring die Strecke zu Ende, ohne abzusetzen, und stell die Hanteln mit geradem Rücken ab.',
    ],
    mistakes: ['Schultern fallen nach vorne', 'Seitliches Schwanken'],
    rule: 'Zielgewicht in jeder Hand, die ganze Zielstrecke, ohne abzusetzen.',
    video: "Farmer's Walk Technik",
  },
  row: {
    muscles: ['Oberer Rücken', 'Breiter Rückenmuskel', 'Hintere Schulter', 'Bizeps'],
    steps: [
      'Greif die Stange schulterbreit, Knie leicht gebeugt.',
      'Beug dich aus der Hüfte vor, bis der Oberkörper fast parallel zum Boden ist, Rücken gerade.',
      'Zieh die Stange zum oberen Bauch und drück die Schulterblätter zusammen.',
      'Lass die Arme kontrolliert lang werden.',
    ],
    mistakes: ['Schummeln durch Aufrichten', 'Runder Rücken'],
    rule: 'Mindestens 1 Wiederholung mit vorgebeugtem Oberkörper, Stange berührt den Bauch.',
    video: 'Langhantelrudern richtige Technik',
  },
};
