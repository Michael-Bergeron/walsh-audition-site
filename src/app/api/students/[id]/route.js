import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const snapshot = await db.ref(`students/${id}`).once('value');
    const student = snapshot.val();
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { selection, scores, bandPlacement, firstName, lastName, grade, studentPlacement, auditionIntegrity, rehearsalSkills } = await request.json();
    
    const ref = db.ref(`students/${id}`);
    const snapshot = await ref.once('value');
    const student = snapshot.val();
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (bandPlacement !== undefined) student.bandPlacement = bandPlacement;
    if (firstName !== undefined) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (grade !== undefined) student.grade = parseInt(grade);
    if (studentPlacement !== undefined) student.studentPlacement = studentPlacement || null;
    if (auditionIntegrity !== undefined) student.auditionIntegrity = auditionIntegrity;
    if (rehearsalSkills !== undefined) student.rehearsalSkills = rehearsalSkills ? parseInt(rehearsalSkills) : null;
    
    if (selection && scores) {
      if (!student.scores) student.scores = {};
      student.scores[selection] = scores;
      
      let newTotal = 0;
      Object.values(student.scores).forEach(selectionScores => {
        if (selectionScores) {
          Object.values(selectionScores).forEach(subScore => {
            if (subScore && subScore.score) {
              newTotal += subScore.score;
            }
          });
        }
      });
      student.totalScore = newTotal;
    }
    
    await ref.set(student);
    
    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const ref = db.ref(`students/${id}`);
    const snapshot = await ref.once('value');
    
    if (!snapshot.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    await ref.remove();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
