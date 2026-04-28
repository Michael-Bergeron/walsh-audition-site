require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('\nERROR: Your FIREBASE_PRIVATE_KEY in .env.local does not look correct.');
    console.error('Make sure you paste the full private_key field from your JSON file, including the -----BEGIN PRIVATE KEY----- parts, and wrap it in quotes.\n');
    process.exit(1);
  }

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

async function migrate() {
  try {
    const fileContents = fs.readFileSync('data.json', 'utf8');
    const studentsArray = JSON.parse(fileContents);
    
    // Convert array to object for Firebase RTDB
    const studentsObj = {};
    studentsArray.forEach(student => {
      studentsObj[student.id] = student;
    });
    
    console.log(`Migrating ${Object.keys(studentsObj).length} students to Firebase...`);
    
    await db.ref('students').set(studentsObj);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

migrate();
