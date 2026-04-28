import Link from 'next/link';
import { getSchemaForInstrument } from '@/lib/schema';
import { db } from '@/lib/firebase';

async function getStudent(id) {
  if (!db) return null;
  try {
    const snapshot = await db.ref(`students/${id}`).once('value');
    return snapshot.val();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function StudentPage({ params }) {
  const { instrument, studentId } = params;
  const student = await getStudent(studentId);
  
  if (!student) {
    return <div>Student not found.</div>;
  }

  const displayInstrument = instrument.charAt(0).toUpperCase() + instrument.slice(1);
  const schema = getSchemaForInstrument(instrument);
  const selections = Object.keys(schema);

  return (
    <div>
      <Link href={`/${instrument}`} className="back-link">
        &larr; Back to {displayInstrument} Students
      </Link>
      
      <h1>Student #{student.number}</h1>
      <p className="subtitle">Select a piece to evaluate</p>
      
      <div className="grid-container">
        {selections.map(selection => {
          const isDone = student.scores && student.scores[selection];
          const slug = encodeURIComponent(selection);
          
          return (
            <Link href={`/${instrument}/${studentId}/${slug}`} key={selection} className="glass-card">
              <h2>{selection}</h2>
              {isDone ? (
                <span className="status-badge status-done">Evaluated</span>
              ) : (
                <span className="status-badge status-not-started">Not Started</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
