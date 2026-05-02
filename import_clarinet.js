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

const rawData = `Evanka	Akula	8	FALSE	Symphonic	Symphonic
Hamza	Al Sumaidaie	8	FALSE	Intermediate	Concert
Asmi	Alex Thomas	8	TRUE	Honor	Honor
Ainsley	Allen	7	TRUE	Concert	Concert
Vrinda	Arvind	8	FALSE	Concert	Concert
Inaya	Bansal	7	TRUE	Symphonic	Symphonic
Ameya	Bharath	7	TRUE	Symphonic	Honor
Nate	Botero	7	TRUE	Intermediate	Concert
Asa	Browning	7	TRUE	Concert	Concert
Allie	Chong	8	FALSE	Honor	Honor
Ihsan	Duzgun	7	FALSE	Concert	Intermediate
Viraat	Gunda	7	TRUE	Concert	Concert
Ksenia	Henriquez	8	FALSE	Intermediate	
Julia	Hsu	8	TRUE	Concert	Honor
Kaiji	Huang	8	FALSE	Concert	Honor
Jake	Hwang	7	TRUE	Honor	Honor
Fadi	Issa	7	FALSE	Symphonic	Symphonic
Alisha	Jadhav	7	FALSE	Symphonic	Honor
Yihwan	Jo	8	FALSE	Intermediate	Honor
Zivah	Jula	8	TRUE	Concert	Symphonic
Abhinav	Kankanala	8	TRUE	Concert	Honor
Niki	Karthikeyan	8	TRUE	Honor	Honor
Sodam	Kim	7	TRUE	Symphonic	Symphonic
Clara	Kirby	7	FALSE	Concert	Symphonic
Artyom	Kniazev	7	TRUE	Symphonic	Honor
Aaron	Ko	7	FALSE	Honor	Symphonic
Connor	Lee	8	TRUE	Honor	Honor
Angela	Lee	7	TRUE	Concert	Symphonic
James	Lindfors	7	FALSE	Honor	Honor
Oscar	Manfredini	8	FALSE	Concert	Symphonic
Jayden	Mathew	8	FALSE	Symphonic	Symphonic
Eshan	Nair	8	FALSE	Honor	Honor
Jian	Park	7	TRUE	Honor	Honor
Tedd	Pramod	7	TRUE	Concert	Honor
Brooklyn	Seals	7	TRUE	Symphonic	Symphonic
Shreyas	Shankar	8	TRUE	Concert	Honor
Sanvi	Singh	7	TRUE	Symphonic	Honor
Srijith	Sridhar	8	TRUE	Symphonic	Symphonic
Tanvi	Srinivasan	8	FALSE	Symphonic	Honor
Sophia	Syed	8	FALSE	Concert	Symphonic
Elisabeth	Terry	8	TRUE	Honor	Honor
Melody	Trevino	7	FALSE	Intermediate	Concert
Sophia	Valadez	8	FALSE	Concert	Concert
Tanmay	Vanipenta	7	TRUE	Concert	Symphonic
Pranav	Vivek	8	TRUE	Symphonic	Symphonic
Aidan	Vu	8	FALSE	Honor	Honor
Serena	Wang	7	TRUE	Honor	Honor
Anderson	Wilson	7	FALSE	Beginner	Concert
Kylie	Wood	7	FALSE	Intermediate	Intermediate
Nolan	Xi	7	TRUE	Intermediate	Honor
Natalia	Ybarra	8	FALSE	Honor	Honor
Gabriel	Zhang	7	FALSE	Honor	Honor`;

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
    const first = parts[0];
    const last = parts[1];
    const grade = parts[2];
    const integrity = parts[3];
    const rehearsal = parts[4];
    const placement = parts[5];
    
    const id = `clarinet-${index + 1}`;
    newStudents[id] = {
      id,
      number: shuffledNumbers[index],
      firstName: first.trim(),
      lastName: last.trim(),
      grade: parseInt(grade),
      auditionIntegrity: integrity.trim().toUpperCase() === 'TRUE',
      rehearsalSkills: rehearsal ? rehearsal.trim() : null,
      studentPlacement: placement ? placement.trim() : null,
      instrument: 'Clarinet',
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

  console.log(`Prepared ${Object.keys(newStudents).length} Clarinet students.`);
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
