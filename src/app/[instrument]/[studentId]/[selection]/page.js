"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSchemaForInstrument, SELECTION_WEIGHTS } from '@/lib/schema';

const TONE_LABELS = ['Beginner', 'Intermediate', 'Concert', 'Symphonic', 'Honor'];

export default function JudgingForm({ params }) {
  const { instrument, studentId, selection } = params;
  const decodedSelection = decodeURIComponent(selection);
  const router = useRouter();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const schema = getSchemaForInstrument(instrument);
  const subcategories = schema[decodedSelection] || [];
  
  const initialScores = {};
  subcategories.forEach(sub => {
    initialScores[sub] = 3; // default to middle value (3/5)
  });

  const [scores, setScores] = useState(initialScores);
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
          
          // Pre-fill if already scored
          if (data.scores && data.scores[decodedSelection]) {
            const saved = data.scores[decodedSelection];
            // Support both old format { score, comment } and new plain number format
            const rebuilt = {};
            subcategories.forEach(sub => {
              const val = saved[sub];
              rebuilt[sub] = typeof val === 'object' ? val.score : (val ?? 3);
            });
            setScores(rebuilt);
            // Restore the single comment if it was saved
            setComment(saved._comment || '');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId, decodedSelection]);

  const handleScoreChange = (category, value) => {
    setScores(prev => ({ ...prev, [category]: parseInt(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Flatten scores + attach single comment as _comment
    const payload = { ...scores, _comment: comment };

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: decodedSelection,
          scores: payload
        })
      });
      
      if (res.ok) {
        router.push(`/${instrument}/${studentId}`);
        router.refresh();
      } else {
        alert('Failed to submit scores');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="subtitle" style={{marginTop: '2rem'}}>Loading...</div>;
  if (!student) return <div>Student not found.</div>;

  const displayInstrument = instrument.charAt(0).toUpperCase() + instrument.slice(1);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/${instrument}/${studentId}`} className="back-link">
        &larr; Back to Student #{student.number}
      </Link>
      
      <h1>Evaluate {decodedSelection}</h1>
      <p className="subtitle">{displayInstrument} - Student #{student.number}</p>
      
      <form onSubmit={handleSubmit} className="glass-panel">
        {Object.keys(scores).map(category => {
          const isTone = category === 'Tone';
          const labels = isTone ? TONE_LABELS : ['1', '2', '3', '4', '5'];
          const currentScore = scores[category];
          const weight = SELECTION_WEIGHTS[decodedSelection]?.[category] ?? 1;

          return (
            <div key={category} className="form-group">
              <div className="form-label">
                <label>
                  {category}
                  {weight > 1 && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>×{weight}</span>}
                </label>
                <span className="score-value">
                  {isTone ? TONE_LABELS[currentScore - 1] : `${currentScore} / 5`}
                  {weight > 1 && <span style={{ marginLeft: '0.3rem', fontSize: '0.8rem', color: '#f59e0b' }}>(={currentScore * weight})</span>}
                </span>
              </div>
              
              <div className="slider-container">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={currentScore}
                  onChange={(e) => handleScoreChange(category, e.target.value)}
                  list={`ticks-${category}`}
                />
                <datalist id={`ticks-${category}`}>
                  <option value="1"></option>
                  <option value="2"></option>
                  <option value="3"></option>
                  <option value="4"></option>
                  <option value="5"></option>
                </datalist>
                <div className="slider-labels">
                  {labels.map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Single comment at the bottom */}
        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <div className="form-label"><label>Comments</label></div>
          <textarea 
            placeholder="General comments for this evaluation..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
}
