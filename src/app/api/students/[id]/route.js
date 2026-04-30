import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { SELECTION_WEIGHTS } from '@/lib/schema';

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
      Object.entries(student.scores).forEach(([selectionName, selectionScores]) => {
        if (!selectionScores) return;
        Object.entries(selectionScores).forEach(([key, subScore]) => {
          if (key === '_comment') return;
          if (typeof subScore === 'object' && subScore !== null && typeof subScore.score === 'undefined') {
            // Nested band column (e.g. Concert/Symphonic/Honor inside Etude)
            Object.entries(subScore).forEach(([cat, catScore]) => {
              if (typeof catScore === 'number') {
                const weight = SELECTION_WEIGHTS[selectionName]?.[cat] ?? 1;
                newTotal += catScore * weight;
              }
            });
          } else {
            const score = typeof subScore === 'number' ? subScore : (subScore?.score ?? 0);
            const weight = SELECTION_WEIGHTS[selectionName]?.[key] ?? 1;
            newTotal += score * weight;
          }
        });
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
