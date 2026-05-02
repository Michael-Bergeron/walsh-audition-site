require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  databaseURL: "https://walsh-audition-default-rtdb.firebaseio.com"
});

const db = admin.database();

const rawData = `Sentiben	Aier	8	TRUE	Honor	Honor
Anaya	Bapat	7	TRUE	Concert	Concert
Danika	Brooks	7	TRUE	Symphonic	Concert
Akshara	Busireddy	8	TRUE	Concert	Symphonic
Keziah	Chacko	8	FALSE	Concert	Concert
Rebecca	d’Avignon	8	FALSE	Symphonic	Symphonic
Abbie	Ding	8	TRUE	Symphonic	Honor
Sophia	Fulks	7	TRUE	Honor	Honor
Anagha	Gogineni	8	TRUE	Symphonic	Symphonic
Ziva	Kaul	7	TRUE	Symphonic	Symphonic
Hyein	Lee	8	FALSE	Honor	Honor
Laim	Lee	8	FALSE	Concert	Honor
Nancy	Liu	7	FALSE	Honor	Honor
Farah	Milhem	7	FALSE	Concert	Symphonic
Joie	Park	8	TRUE	Honor	Honor
Varshini	Patchipulusu	7	TRUE	Symphonic	Honor
Addy	Philastre	7	FALSE	Intermediate	
Navni	Prasad	7	TRUE	Honor	Honor
Amelie	Pribadi	8	FALSE	Honor	Honor
Ana Luisa	Salcedo	7	TRUE	Honor	Honor
Wilfred	Soeholm-Bruun	7	FALSE	Concert	Symphonic
Ryan	Stacer	8	TRUE	Symphonic	Symphonic
Kanishk	Veeramachaneni	7	TRUE	Symphonic	Symphonic
Seoyoon	Yang	8	FALSE	Symphonic	Symphonic
Laura	Zhao	7	TRUE	Honor	Honor`;

async function run() {
  const lines = rawData.trim().split('\n');
  const studentsCount = lines.length;
  
  // Generate randomized numbers 1 to studentsCount
  const numbers = Array.from({ length: studentsCount }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[numbers[j]]] = [numbers[j], numbers[i]]; // Wait, fixed below
  }
  
  // Actually shuffle
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  const shuffledNumbers = shuffle([...numbers]);

  const students = {};
  lines.forEach((line, index) => {
    const [first, last, grade, integrity, rehearsal, placement] = line.split('\t');
    const id = `flute-${index + 1}`;
    students[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first.trim(),
      lastName: last.trim(),
      grade: parseInt(grade),
      auditionIntegrity: integrity.trim().toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal.trim() || null,
      studentPlacement: placement ? placement.trim() : null,
      instrument: 'Flute',
      totalScore: 0,
      status: 'not-started',
      scores: {
        'Etude': null,
        'Major Scale': null,
        'Chromatic Scale': null,
        'Woodwind Workout': null
      }
    };
  });

  console.log(`Prepared ${Object.keys(students).length} Flute students.`);

  // WIPE AND REPLACE
  console.log("Wiping existing students...");
  await db.ref('students').set(students);
  console.log("Database updated successfully.");

  // Update local data.json for consistency
  const dataArray = Object.values(students);
  fs.writeFileSync('data.json', JSON.stringify(dataArray, null, 2));
  console.log("data.json updated successfully.");

  process.exit(0);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
