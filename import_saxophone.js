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

const rawData = `Kat	Cunningham	8	TRUE	TRUE	Symphonic	Symphonic
Arsh	Deshmukh	8	TRUE	TRUE	Symphonic	Honor
Mateo	Gonzalez	7	FALSE	TRUE	Symphonic	Concert
Lamar	Gordon	7	FALSE	TRUE	Intermediate	Honor
Hasini	Hewa-Kasakarage	7	TRUE	FALSE	Honor	Honor
Elli	Hwang	7	TRUE	TRUE	Honor	Honor
Seungyu	Kang	8	FALSE	FALSE	Honor	Honor
Vihaan	Kekre	8	FALSE	FALSE	Concert	Symphonic
Seojun	Lee	8	FALSE	FALSE	Symphonic	Honor
Iryna	Lypova	7	TRUE	TRUE	Concert	Concert
Vihaan	Manoj	7	TRUE	TRUE	Symphonic	Honor
Sophia	Melendez	8	FALSE	FALSE	Concert	Symphonic
Yuno	Mishina	8	FALSE	FALSE	Honor	Honor
Srihan	Nandigam	7	TRUE	TRUE	Symphonic	Honor
Parker	Nolan	7	FALSE	FALSE	Intermediate	Concert
Ethan	Peng	8	FALSE	FALSE	Symphonic	Honor
Jonas	Peralta	8	FALSE	FALSE	Intermediate	Symphonic
Ethan	Peredo	7	FALSE	TRUE	Concert	Symphonic
Brianna	Rangel	7	TRUE	TRUE	Concert	Honor
Ekagra	Saksham	7	FALSE	FALSE	Honor	Honor
Sophia	Schorle	7	FALSE	FALSE	Concert	Concert
Karly	Stark	8	TRUE	TRUE	Symphonic	Symphonic
Gabriel	Tsapikau	7	TRUE	TRUE	Concert	Symphonic
Renata	Veliz Araujo	7	TRUE	TRUE	Symphonic	Symphonic
Vedha	Vigneswaran	7	FALSE	FALSE	Honor	Honor
Landon	Wittenauer	8	FALSE	FALSE	Concert	Intermediate`;

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
    // Index 3 is Sax Preference Form (ignore)
    const integrity = parts[4].trim();
    const rehearsal = parts[5].trim();
    const placement = parts[6] ? parts[6].trim() : null;
    
    const id = `saxophone-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first,
      lastName: last,
      grade: parseInt(grade),
      auditionIntegrity: integrity.toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal || null,
      studentPlacement: placement || null,
      instrument: 'Saxophone',
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

  console.log(`Prepared ${Object.keys(newStudents).length} Saxophone students.`);
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
