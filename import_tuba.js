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

const rawData = `Darius	Alagar	8	FALSE	Symphonic	Honor
Grayson	Brady	8	FALSE	Symphonic	Symphonic
Sofia	Chaves	7	FALSE	Honor	Honor
Ethan	Fisher	8	TRUE	Concert	Honor
Jeremiah	Martinez	7	FALSE	Intermediate	
August	Power	7	TRUE	Honor	Honor
Sidharth	Sarath	7	FALSE	Concert	Symphonic
Angel	Torres	7	FALSE	Symphonic	Symphonic
Arnold	Villanueva	7	FALSE	Concert	Concert
Zoey	Zertuche	7	FALSE	Concert	Concert`;

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
    
    const id = `tuba-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first,
      lastName: last,
      grade: parseInt(grade),
      auditionIntegrity: integrity.toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal || null,
      studentPlacement: placement || null,
      instrument: 'Tuba',
      totalScore: 0,
      status: 'not-started',
      scores: {
        'Etude': null,
        'Major Scale': null,
        'Chromatic Scale': null,
        'Brass Workout': null
      }
    };
  });

  console.log(`Prepared ${Object.keys(newStudents).length} Tuba students.`);
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
