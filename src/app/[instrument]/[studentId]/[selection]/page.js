"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSchemaForInstrument } from '@/lib/schema';

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
    initialScores[sub] = { score: 4, comment: '' };
  });

  const [scores, setScores] = useState(initialScores);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
          
          // Pre-fill if already scored
          if (data.scores && data.scores[decodedSelection]) {
            setScores(data.scores[decodedSelection]);
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
    setScores(prev => ({
      ...prev,
      [category]: { ...prev[category], score: parseInt(value) }
    }));
  };

  const handleCommentChange = (category, value) => {
    setScores(prev => ({
      ...prev,
      [category]: { ...prev[category], comment: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: decodedSelection,
          scores: scores
        })
      });
      
      if (res.ok) {
        // Navigate back to the student page
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
        {Object.keys(scores).map(category => (
          <div key={category} className="form-group">
            <div className="form-label">
              <label>{category}</label>
              <span className="score-value">{scores[category].score} / 4</span>
            </div>
            
            <div className="slider-container">
              <input 
                type="range" 
                min="1" 
                max="4" 
                step="1"
                value={scores[category].score}
                onChange={(e) => handleScoreChange(category, e.target.value)}
                list={`ticks-${category}`}
              />
              <datalist id={`ticks-${category}`}>
                <option value="1"></option>
                <option value="2"></option>
                <option value="3"></option>
                <option value="4"></option>
              </datalist>
              <div className="slider-labels">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>
            
            <textarea 
              placeholder={`Comments for ${category}...`}
              value={scores[category].comment}
              onChange={(e) => handleCommentChange(category, e.target.value)}
            />
          </div>
        ))}
        
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
}
