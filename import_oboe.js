require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: "https://walsh-audition-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

const rawData = `Chasity	Coburn	8	TRUE	Honor	Honor
Ellie	Ge	7	TRUE	Symphonic	Honor
Scarlet	Mobley	7	FALSE	Symphonic	Honor
Bennett	Neuman	8	FALSE	Intermediate	Intermediate
Saanvi	Patil	7	FALSE	Symphonic	Symphonic
Pranshi	Shilarnav	8	TRUE	Honor	Honor
Charlotte	Woodlock	7	FALSE	Intermediate	Concert`;

async function run() {
  const lines = rawData.trim().split('\n');
  const studentsCount = lines.length;
  
  // Shuffle numbers 1 to studentsCount
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  const shuffledNumbers = shuffle(Array.from({ length: studentsCount }, (_, i) => i + 1));

  const newStudents = {};
  lines.forEach((line, index) => {
    const [first, last, grade, integrity, rehearsal, placement] = line.split('\t');
    const id = `oboe-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first.trim(),
      lastName: last.trim(),
      grade: parseInt(grade),
      auditionIntegrity: integrity.trim().toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal.trim() || null,
      studentPlacement: placement ? placement.trim() : null,
      instrument: 'Oboe',
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

  console.log(`Prepared ${Object.keys(newStudents).length} Oboe students.`);

  const ref = db.ref('students');
  
  // Update Firebase (merge)
  console.log("Adding Oboe students to Firebase...");
  await ref.update(newStudents);
  console.log("Firebase updated successfully.");

  // Update local data.json
  const snapshot = await ref.once('value');
  const allStudents = snapshot.val();
  if (allStudents) {
    fs.writeFileSync('data.json', JSON.stringify(Object.values(allStudents), null, 2));
    console.log("data.json updated successfully.");
  }

  process.exit(0);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
