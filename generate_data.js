const fs = require('fs');

const WOODWINDS = ['Clarinet', 'Saxophone', 'Flute', 'Oboe', 'Bassoon'];
const BRASS = ['Trumpet', 'Trombone', 'Horn', 'Euphonium', 'Tuba'];
const PERCUSSION = ['Percussion'];

const INSTRUMENT_SCHEMA = {
  WOODWINDS: {
    'Etude': ['Tone', 'Articulation', 'Dynamics', 'Technique', 'Rhythm'],
    'Major Scale': ['Tone', 'Articulation', 'Technique'],
    'Chromatic Scale': ['Tone', 'Technique'],
    'Woodwind Workout': ['Tone', 'Articulation', 'Technique', 'Rhythm']
  },
  BRASS: {
    'Etude': ['Tone', 'Articulation', 'Dynamics', 'Technique', 'Rhythm'],
    'Major Scale': ['Tone', 'Articulation', 'Technique'],
    'Chromatic Scale': ['Tone', 'Technique'],
    'Remmington': ['Tone', 'Articulation', 'Technique', 'Rhythm']
  },
  PERCUSSION: {
    'Etude': ['Tone', 'Articulation', 'Dynamics', 'Technique', 'Rhythm'],
    'F scale sequence': ['Tone', 'Articulation', 'Technique'],
    'A scale sequence': ['Tone', 'Technique']
  }
};

const getInstrumentFamily = (instrument) => {
  if (WOODWINDS.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'WOODWINDS';
  if (BRASS.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'BRASS';
  if (PERCUSSION.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'PERCUSSION';
  return 'WOODWINDS'; // Fallback
};

const instruments = [
  'Clarinet', 'Saxophone', 'Flute', 'Oboe', 'Bassoon', 
  'Trumpet', 'Trombone', 'Horn', 'Euphonium', 'Tuba', 'Percussion'
];

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomGrade = () => Math.floor(Math.random() * 4) + 9;

const data = [];

instruments.forEach(instrument => {
  for (let i = 1; i <= 10; i++) {
    const family = getInstrumentFamily(instrument);
    const schema = INSTRUMENT_SCHEMA[family];
    const scores = {};
    Object.keys(schema).forEach(selection => {
      scores[selection] = null;
    });

    data.push({
      id: `${instrument.toLowerCase()}-${i}`,
      number: i,
      firstName: getRandom(firstNames),
      lastName: getRandom(lastNames),
      grade: getRandomGrade(),
      studentPlacement: null,
      totalScore: 0,
      instrument: instrument,
      scores: scores
    });
  }
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('data.json updated successfully');
