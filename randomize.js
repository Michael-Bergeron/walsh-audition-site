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

async function run() {
  console.log("Randomizing Firebase data...");
  const ref = db.ref('students');
  const snapshot = await ref.once('value');
  const students = snapshot.val();
  
  if (students) {
    const updates = {};
    for (const id in students) {
      const randomGrade = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
      updates[`${id}/grade`] = randomGrade;
    }
    await ref.update(updates);
    console.log("Randomized Firebase grades successfully.");
  }
  
  console.log("Randomizing local data.json...");
  if (fs.existsSync('data.json')) {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    data.forEach(student => {
      student.grade = Math.floor(Math.random() * 3) + 6;
    });
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log("Randomized data.json successfully.");
  }

  process.exit(0);
}

run().catch(console.error);
