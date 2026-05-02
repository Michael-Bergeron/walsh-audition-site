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

const rawData = `Zephee	Amdur	7	FALSE	Concert	Concert
Victor	Anderson	7	FALSE	Concert	Concert
Caroline	Anderson	7	FALSE	Symphonic	Honor
Tanvish	Aramadaka	7	FALSE	Concert	Honor
Leo	Dumapat	7	FALSE	Honor	Honor
Ava	Emanuel	7	TRUE	Concert	Honor
Lulu	Fender	8	FALSE	Symphonic	Symphonic
Shresta	Gopalakrishnan	8	TRUE	Concert	Honor
Adam	Haas	7	FALSE	Honor	Honor
Jio	Han	7	FALSE	Concert	Honor
Adam	House	7	FALSE	Concert	Symphonic
Arini	Jain	7	FALSE	Symphonic	Symphonic
Euisung	Jung	8	FALSE	Honor	Honor
Tyler	Mast	7	FALSE	Intermediate	Concert
Adrian	Meono-Monsivais	7	FALSE	Honor	Honor
Kate	Park	8	TRUE	Symphonic	Honor
Niyanth	Raghuram	8	TRUE	Honor	Honor
Ragini	Ramesh	8	TRUE	Concert	Honor
Irene	Renjith	7	TRUE	Honor	Honor
Sadie	Shumake	7	FALSE	Symphonic	Symphonic
Avery	Tyler	8	FALSE	Honor	Symphonic
Anish	Ved	8	FALSE	Concert	Concert
William	Wood	7	FALSE	Honor	Honor`;

async function run() {
  const lines = rawData.trim().split('\n');
  const studentsCount = lines.length;
  
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
    const parts = line.split('\t');
    const first = parts[0].trim();
    const last = parts[1].trim();
    const grade = parts[2].trim();
    const integrity = parts[3].trim();
    const rehearsal = parts[4].trim();
    const placement = parts[5] ? parts[5].trim() : null;
    
    const id = `percussion-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first,
      lastName: last,
      grade: parseInt(grade),
      auditionIntegrity: integrity.toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal || null,
      studentPlacement: placement || null,
      instrument: 'Percussion',
      totalScore: 0,
      status: 'not-started',
      scores: {
        'Etude': null,
        'F scale sequence': null,
        'A scale sequence': null
      }
    };
  });

  console.log(`Prepared ${Object.keys(newStudents).length} Percussion students.`);
  const ref = db.ref('students');
  await ref.update(newStudents);
  console.log("Firebase updated successfully.");

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
