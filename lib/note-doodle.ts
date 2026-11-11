// Shared by SVG stationery and the canvas export so downloaded notes keep their pen marks.
export const notePen = '#343b37';
export const noteDoodleMarks = {
  square: 'M88 5l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3M3 87l2 2m-2 2 2 2M85 94q-4-4-5-1t5 5q7-4 5-6t-5 2',
  heart: 'M18 12l1 3 3 1-3 1-1 4-1-4-3-1 3-1 1-3M78 12l4 3m-5 1 4 3M46 83q-4-5-6-1t10 9q12-8 9-11t-9 3',
  star: 'M49 12l1 4 4 1-4 1-1 5-1-5-4-1 4-1 1-4M14 37l4 3m-5 1 4 3M72 82l3 2m-5 2 3 2',
  leaf: 'M81 11l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4M17 71l4 2m-5 2 4 2M37 84q-4-5-6-1t7 6q9-5 6-8t-7 3',
} as const;
export const noteTapePath = 'M2 2 96 1 93 8 99 14 95 21 98 28 3 29 6 22 1 16 6 9Z';
export const noteTapeMarks = 'M13 4 9 12m15-8-9 20M35 5 25 25M47 5 37 25M59 5 49 25M71 5 61 25M83 5 73 25M93 7 84 24';
