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
    students.sort((a, b) => a.number - b.number);
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
          const schema = getSchemaForInstrument(instrument);
          const abbr = {
            'Etude': 'Etude',
            'Major Scale': 'Major',
            'Chromatic Scale': 'Chrom',
            'Woodwind Workout': 'WW',
            'Remington': 'Rem',
            'F scale sequence': 'F',
            'E Scale Sequence': 'E'
          };
          
          return (
            <Link href={`/${instrument}/${student.id}`} key={student.id} className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Student #{student.number}</h2>
                {student.studentPlacement && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Goal: <strong style={{ color: 'var(--text-main)' }}>{student.studentPlacement}</strong>
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(schema).length}, 1fr)`, gap: '0.3rem' }}>
                {Object.keys(schema).map(selection => {
                  const isEvaluated = student.scores && student.scores[selection];
                  return (
                    <div key={selection} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{abbr[selection] || selection}</span>
                      {isEvaluated ? (
                        <span style={{ color: 'var(--success)', fontSize: '0.7rem' }}>Done</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Incomplete</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
        {students.length === 0 && <p>No students found for this instrument.</p>}
      </div>
    </div>
  );
}
