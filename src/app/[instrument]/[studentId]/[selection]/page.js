"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSchemaForInstrument, SELECTION_WEIGHTS } from '@/lib/schema';

const TONE_LABELS = ['Beginner', 'Intermediate', 'Concert', 'Symphonic', 'Honor'];
const ETUDE_BANDS = ['Concert', 'Symphonic', 'Honor'];

function SliderGroup({ category, currentScore, decodedSelection, onChange }) {
  const isTone = category === 'Tone';
  const labels = isTone ? TONE_LABELS : ['1', '2', '3', '4', '5'];

  return (
    <div className="form-group">
      <div className="form-label">
        <label>{category}</label>
      </div>
      <div className="slider-container">
        <input 
          type="range" 
          min="1" 
          max="5" 
          step="1"
          value={currentScore}
          onChange={(e) => onChange(parseInt(e.target.value))}
          list={`ticks-${category}-${decodedSelection}`}
        />
        <datalist id={`ticks-${category}-${decodedSelection}`}>
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
}

export default function JudgingForm({ params }) {
  const { instrument, studentId, selection } = params;
  const decodedSelection = decodeURIComponent(selection);
  const router = useRouter();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const schema = getSchemaForInstrument(instrument);
  const subcategories = schema[decodedSelection] || [];
  const isEtude = decodedSelection === 'Etude';

  // For Etude: { Concert: {Tone:3,...}, Symphonic: {...}, Honor: {...} }
  // For others: { Tone: 3, Articulation: 3, ... }
  const buildInitial = () => {
    if (isEtude) {
      const bands = {};
      ETUDE_BANDS.forEach(band => {
        const s = {};
        subcategories.forEach(sub => { s[sub] = 3; });
        bands[band] = s;
      });
      return bands;
    }
    const s = {};
    subcategories.forEach(sub => { s[sub] = 3; });
    return s;
  };

  const [scores, setScores] = useState(buildInitial);
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
          
          if (data.scores && data.scores[decodedSelection]) {
            const saved = data.scores[decodedSelection];
            setComment(saved._comment || '');

            if (isEtude) {
              // Restore nested band scores
              const rebuilt = buildInitial();
              ETUDE_BANDS.forEach(band => {
                if (saved[band]) {
                  subcategories.forEach(sub => {
                    const val = saved[band][sub];
                    rebuilt[band][sub] = typeof val === 'number' ? val : (val?.score ?? 3);
                  });
                }
              });
              setScores(rebuilt);
            } else {
              const rebuilt = {};
              subcategories.forEach(sub => {
                const val = saved[sub];
                rebuilt[sub] = typeof val === 'object' ? (val?.score ?? 3) : (val ?? 3);
              });
              setScores(rebuilt);
            }
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

  const handleScoreChange = (bandOrCategory, categoryOrValue, value) => {
    if (isEtude) {
      // bandOrCategory = band name, categoryOrValue = category, value = number
      setScores(prev => ({
        ...prev,
        [bandOrCategory]: { ...prev[bandOrCategory], [categoryOrValue]: value }
      }));
    } else {
      setScores(prev => ({ ...prev, [bandOrCategory]: categoryOrValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = isEtude
      ? { ...scores, _comment: comment }
      : { ...scores, _comment: comment };

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: decodedSelection, scores: payload })
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
    <div style={{ maxWidth: isEtude ? '1400px' : '800px', margin: '0 auto' }}>
      <Link href={`/${instrument}/${studentId}`} className="back-link">
        &larr; Back to Student #{student.number}
      </Link>
      
      <h1>Evaluate {decodedSelection}</h1>
      <p className="subtitle">{displayInstrument} - Student #{student.number}</p>
      
      <form onSubmit={handleSubmit}>
        {isEtude ? (
          // 3-column Etude layout
          <div className="etude-columns">
            {ETUDE_BANDS.map(band => (
              <div key={band} className="etude-column glass-panel">
                <h3 className="etude-band-heading">{band}</h3>
                {subcategories.map(category => (
                  <SliderGroup
                    key={category}
                    category={category}
                    currentScore={scores[band]?.[category] ?? 3}
                    decodedSelection={`${decodedSelection}-${band}`}
                    onChange={(val) => handleScoreChange(band, category, val)}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          // Standard single-column layout
          <div className="glass-panel">
            {subcategories.map(category => (
              <SliderGroup
                key={category}
                category={category}
                currentScore={scores[category] ?? 3}
                decodedSelection={decodedSelection}
                onChange={(val) => handleScoreChange(category, val)}
              />
            ))}
          </div>
        )}

        {/* Single comment and submit always at the bottom */}
        <div style={{ maxWidth: '500px', margin: '1.5rem auto 0' }}>
          <div className="glass-panel">
            <div className="form-group">
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
          </div>
        </div>
      </form>
    </div>
  );
}
