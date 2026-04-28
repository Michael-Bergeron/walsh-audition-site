import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getSchemaForInstrument } from '@/lib/schema';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const instrument = searchParams.get('instrument');
    
    const snapshot = await db.ref('students').once('value');
    const studentsData = snapshot.val() || {};
    let students = Object.values(studentsData);
    
    if (instrument) {
      students = students.filter(s => s.instrument.toLowerCase() === instrument.toLowerCase());
    }
    
    return NextResponse.json(students);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { firstName, lastName, instrument, grade, studentPlacement } = data;
    
    if (!firstName || !lastName || !instrument || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const snapshot = await db.ref('students').once('value');
    const studentsData = snapshot.val() || {};
    const students = Object.values(studentsData);
    
    const instrumentStudents = students.filter(s => s.instrument.toLowerCase() === instrument.toLowerCase());
    const nextNumber = instrumentStudents.length > 0 
      ? Math.max(...instrumentStudents.map(s => s.number)) + 1 
      : 1;
      
    const schema = getSchemaForInstrument(instrument);
    const emptyScores = {};
    Object.keys(schema).forEach(selection => {
      emptyScores[selection] = {};
      schema[selection].forEach(cat => {
        emptyScores[selection][cat] = { score: 0, comment: '' };
      });
    });
    
    const id = `${instrument.toLowerCase()}-${nextNumber}`;
    const newStudent = {
      id,
      number: nextNumber,
      instrument: instrument.charAt(0).toUpperCase() + instrument.slice(1).toLowerCase(),
      scores: emptyScores,
      firstName,
      lastName,
      totalScore: 0,
      grade: parseInt(grade),
      studentPlacement: studentPlacement || null,
      bandPlacement: null
    };
    
    await db.ref(`students/${id}`).set(newStudent);
    
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
