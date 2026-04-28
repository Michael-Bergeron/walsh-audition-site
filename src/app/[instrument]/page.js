import Link from 'next/link';
import { getSchemaForInstrument } from '@/lib/schema';
import { db } from '@/lib/firebase';

async function getStudents(instrument) {
  if (!db) return [];
  try {
    const snapshot = await db.ref('students').once('value');
    const studentsData = snapshot.val() || {};
    let students = Object.values(studentsData);
    if (instrument) {
      students = students.filter(s => s.instrument.toLowerCase() === instrument.toLowerCase());
    }
    return students;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function InstrumentPage({ params }) {
  const { instrument } = params;
  const students = await getStudents(instrument);
  
  // Capitalize first letter for display
  const displayInstrument = instrument.charAt(0).toUpperCase() + instrument.slice(1);

  return (
    <div>
      <Link href="/" className="back-link">
        &larr; Back to Instruments
      </Link>
      
      <h1>{displayInstrument} Auditions</h1>
      <p className="subtitle">Select a student number to evaluate</p>
      
      <div className="grid-container">
        {students.map(student => {
          // Check how many selections are scored
          const schema = getSchemaForInstrument(instrument);
          const totalSelections = Object.keys(schema).length;
          const scoredCount = Object.keys(schema).filter(sel => student.scores && student.scores[sel]).length;
          
          let statusText = 'Not Started';
          let statusClass = 'status-not-started';
          
          if (scoredCount === totalSelections) {
            statusText = 'Evaluated';
            statusClass = 'status-done';
          } else if (scoredCount > 0) {
            statusText = 'Pending';
            statusClass = 'status-pending';
          }
            
          return (
            <Link href={`/${instrument}/${student.id}`} key={student.id} className="glass-card">
              <h2>Student #{student.number}</h2>
              <span className={`status-badge ${statusClass}`}>{statusText}</span>
            </Link>
          );
        })}
        {students.length === 0 && <p>No students found for this instrument.</p>}
      </div>
    </div>
  );
}
