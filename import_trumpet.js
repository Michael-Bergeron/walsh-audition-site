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

const rawData = `Malhar	Bagal	7	TRUE	Symphonic	Honor
Zack	Bingham	8	TRUE	Honor	Honor
Noah	Blumenthal	7	FALSE	Intermediate	Intermediate
Yenny	Chae	7	FALSE	Symphonic	Honor
Murray	Chevrier	7	FALSE	Intermediate	Intermediate
Charlotte	Cramer	8	FALSE	Intermediate	Symphonic
Danny	Darby	8	TRUE	Concert	Honor
Henry	Eldridge	7	FALSE	Intermediate	Concert
Jude	Ferrero	8	TRUE	Honor	Honor
Chance	Hester	7	TRUE	Concert	Honor
Sunwoo	Jung	8	TRUE	Honor	Honor
Vihaan	Kalra	7	TRUE	Honor	Honor
Harper	Kocis	7	TRUE	Concert	Symphonic
Sumeru	Kulkarni	7	FALSE	Symphonic	Symphonic
Jacob	Mast	7	FALSE	Concert	Concert
Anika	Muthyala	7	TRUE	Concert	Symphonic
Ritvik	Nayak	8	FALSE	Symphonic	Honor
Theo	Nellans	8	FALSE	Honor	Honor
Amani	Njigua	7	FALSE	Intermediate	Concert
Shikha	Palle	8	TRUE	Concert	Symphonic
Vedanth	Patlola	8	TRUE	Symphonic	Honor
Prince	Peterson	7	TRUE	Symphonic	Symphonic
Everett	Platt	8	TRUE	Honor	Honor
Aanya	Poundarik	7	TRUE	Honor	Honor
Rishi	Preeth	7	TRUE	Concert	Symphonic
Aashvi	Rathi	8	TRUE	Symphonic	Honor
Tom	Rautemberg Luna	7	FALSE	Symphonic	Intermediate
Adam	Semchyshyn	7	FALSE	Intermediate	Symphonic
James	Sibert	7	TRUE	Symphonic	Honor
Nolan	Strickland	7	FALSE	Concert	Intermediate
Athira	Swaminathan	8	TRUE	Symphonic	Honor
Zeph	Wortman	7	FALSE	Intermediate	Honor`;

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
    
    const id = `trumpet-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first,
      lastName: last,
      grade: parseInt(grade),
      auditionIntegrity: integrity.toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal || null,
      studentPlacement: placement || null,
      instrument: 'Trumpet',
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

  console.log(`Prepared ${Object.keys(newStudents).length} Trumpet students.`);
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
