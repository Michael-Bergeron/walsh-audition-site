export const WOODWINDS = ['Clarinet', 'Saxophone', 'Flute', 'Oboe', 'Bassoon'];
export const BRASS = ['Trumpet', 'Trombone', 'Horn', 'Euphonium', 'Tuba'];
export const PERCUSSION = ['Percussion'];

export const INSTRUMENT_SCHEMA = {
  WOODWINDS: {
    'Etude': ['Tone', 'Articulation', 'Dynamics', 'Technique'],
    'Major Scale': ['Tone', 'Articulation', 'Technique'],
    'Chromatic Scale': ['Tone', 'Technique'],
    'Woodwind Workout': ['Tone', 'Articulation', 'Technique', 'Rhythm']
  },
  BRASS: {
    'Etude': ['Tone', 'Articulation', 'Dynamics', 'Technique'],
    'Major Scale': ['Tone', 'Articulation', 'Technique'],
    'Chromatic Scale': ['Tone', 'Technique'],
    'Remington': ['Tone', 'Articulation', 'Technique', 'Rhythm']
  },
  PERCUSSION: {
    'Etude': ['Tone', 'Dynamics', 'Technique'],
    'F scale sequence': ['Tone', 'Technique'],
    'A scale sequence': ['Tone', 'Technique']
  }
};

// Subcategory score multipliers per selection
export const SELECTION_WEIGHTS = {
  'Etude': {
    'Tone': 3
  },
  'Major Scale': {
    'Tone': 2
  }
};

const getInstrumentFamily = (instrument) => {
  if (WOODWINDS.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'WOODWINDS';
  if (BRASS.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'BRASS';
  if (PERCUSSION.some(i => i.toLowerCase() === instrument.toLowerCase())) return 'PERCUSSION';
  return 'WOODWINDS'; // Fallback
};

export const getSchemaForInstrument = (instrument) => {
  const family = getInstrumentFamily(instrument);
  return INSTRUMENT_SCHEMA[family];
};
