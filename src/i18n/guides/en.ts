import type { Guide } from '@/lib/guide';

export const en: Record<string, Guide> = {
  squat: {
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    steps: [
      'Set the bar on your upper back, on top of the traps. Feet shoulder-width apart, toes slightly out.',
      'Breathe in and brace your core. Sit down by pushing your hips back and down.',
      'Keep your knees tracking over your toes. Your hips should drop at least to knee level.',
      'Drive up through your heels, keeping your chest up.',
    ],
    mistakes: ['Knees caving in', 'Heels lifting off the floor', 'Not squatting deep enough'],
    rule: 'At least 1 full rep at the goal weight: hips must reach knee level.',
    video: 'back squat proper form',
  },
  deadlift: {
    muscles: ['Hamstrings', 'Glutes', 'Back', 'Grip'],
    steps: [
      'Bar over the middle of your feet, feet hip-width apart.',
      'Bend down and grip the bar just outside shoulder width. Shins touch the bar.',
      'Lift your chest, keep your back flat and brace your core.',
      'Keep the bar close to your legs as you extend hips and knees together, then lock out your hips at the top.',
    ],
    mistakes: ['Rounding the back', 'Letting the bar drift away from the body', 'Leaning back at the top'],
    rule: 'At least 1 rep at the goal weight, with a full lockout at the top.',
    video: 'deadlift proper form',
  },
  bench: {
    muscles: ['Chest', 'Front delts', 'Triceps'],
    steps: [
      'Lie down with your eyes under the bar, feet flat on the floor.',
      'Squeeze your shoulder blades together and grip the bar slightly wider than shoulders.',
      'Lower the bar under control to your lower chest.',
      'With elbows at about 45° to your body, press the bar up until your arms are straight.',
    ],
    mistakes: ['Flaring elbows straight out', 'Bouncing the bar off the chest', 'Lifting the hips off the bench'],
    rule: 'The bar must touch the chest and the arms must fully lock out.',
    video: 'bench press proper form',
  },
  ohp: {
    muscles: ['Shoulders', 'Triceps', 'Upper back', 'Core'],
    steps: [
      'Hold the bar on top of your collarbones, hands shoulder-width apart.',
      'Squeeze your glutes and core, and don’t over-arch your lower back.',
      'Pull your head back slightly and press the bar straight up.',
      'Once the bar passes your head, bring your head forward and lock your arms.',
    ],
    mistakes: ['Leaning back too far', 'Using leg drive', 'Pressing the bar in an arc in front of you'],
    rule: 'Standing, no leg drive, arms locked out at the top.',
    video: 'overhead press proper form',
  },
  pushup: {
    muscles: ['Chest', 'Triceps', 'Front delts', 'Core'],
    steps: [
      'Hands slightly wider than shoulders, body straight from head to heels.',
      'Brace your core and glutes.',
      'Lower until your chest is close to the floor, elbows at about 45°.',
      'Push through your palms back to the start and fully straighten your arms.',
    ],
    mistakes: ['Hips sagging or piking up', 'Doing half reps'],
    rule: 'In one set without resting. Chest close to the floor, arms fully straight.',
    video: 'push up proper form',
  },
  pullup: {
    muscles: ['Lats', 'Biceps', 'Forearms', 'Upper back'],
    steps: [
      'Grip the bar slightly wider than your shoulders, palms facing away.',
      'Hang with arms fully straight and pull your shoulders down.',
      'Pull your chest toward the bar until your chin clears it.',
      'Lower under control and fully straighten your arms.',
    ],
    mistakes: ['Kipping or swinging with the legs', 'Not straightening the arms at the bottom'],
    rule: 'Start from a dead hang, chin over the bar, no swinging.',
    video: 'pull up proper form',
  },
  bulgarian: {
    muscles: ['Quads', 'Glutes', 'Balance'],
    steps: [
      'Rest the top of your back foot on a bench, a dumbbell in each hand.',
      'Your front foot should be about one stride in front of the bench.',
      'Keep your torso upright and lower until your back knee nears the floor.',
      'Drive up through your front heel. Do the same rep on both legs.',
    ],
    mistakes: ['Front knee caving in', 'Front foot too close to the bench'],
    rule: 'With a dumbbell of the goal weight in each hand, at least 1 rep on each leg.',
    video: 'bulgarian split squat form',
  },
  farmer: {
    muscles: ['Grip', 'Traps', 'Core', 'Legs'],
    steps: [
      'Pick the dumbbells up from the floor with a flat back, like a deadlift.',
      'Shoulders back, chest up, arms long.',
      'Walk in a straight line with short, quick steps.',
      'Finish the distance without dropping them, then set them down with a flat back.',
    ],
    mistakes: ['Shoulders rolling forward', 'Swaying side to side'],
    rule: 'The goal weight in each hand, for the full goal distance without setting it down.',
    video: "farmer's walk form",
  },
  row: {
    muscles: ['Upper back', 'Lats', 'Rear delts', 'Biceps'],
    steps: [
      'Grip the bar shoulder-width apart, knees slightly bent.',
      'Hinge forward at the hips until your torso is almost parallel to the floor, back flat.',
      'Pull the bar to your upper stomach and squeeze your shoulder blades.',
      'Lower under control until your arms are straight.',
    ],
    mistakes: ['Cheating by standing up', 'Rounding the back'],
    rule: 'At least 1 rep with the torso staying bent over, bar touching the stomach.',
    video: 'barbell bent over row form',
  },
};
