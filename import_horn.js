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

const rawData = `Ethan	Bergeron	8	TRUE	Honor	Honor
Braden	Bunce	8	FALSE	Honor	Symphonic
Aidan	Fokken	7	FALSE	Intermediate	Concert
Thoshika	Gali	7	TRUE	Honor	Honor
Reyansh	Jha	7	FALSE	Intermediate	
Elianna	Ma-Zepeta	8	TRUE	Honor	Honor
Evan	McGahee	7	FALSE	Symphonic	Honor
Julia	Moore	7	TRUE	Symphonic	Honor
Neha	Murali	8	FALSE	Honor	Honor
Tamanna	Narayan	8	FALSE	Honor	Honor
Ishaan	Patel	7	FALSE	Intermediate	Symphonic
Advika	Raina	7	TRUE	Symphonic	Honor
Selah	Young	7	TRUE	Symphonic	Symphonic
Caden	Zertuche	8	FALSE	Concert	Concert
Abby	Zisman	7	TRUE	Concert	Concert`;

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
    
    const id = `horn-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first,
      lastName: last,
      grade: parseInt(grade),
      auditionIntegrity: integrity.toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal || null,
      studentPlacement: placement || null,
      instrument: 'Horn',
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

  console.log(`Prepared ${Object.keys(newStudents).length} Horn students.`);
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
