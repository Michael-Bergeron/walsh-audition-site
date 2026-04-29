"use client";

import { useState } from 'react';
import Link from 'next/link';

const instruments = [
  'Flute', 'Oboe', 'Bassoon', 'Clarinet', 'Saxophone', 
  'Trumpet', 'Horn', 'Trombone', 'Euphonium', 'Tuba', 'Percussion'
];

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    instrument: 'Clarinet',
    grade: '6',
    studentPlacement: '',
    rehearsalSkills: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Student added successfully!');
        setShowModal(false);
        setFormData({ firstName: '', lastName: '', instrument: 'Clarinet', grade: '6', studentPlacement: '', rehearsalSkills: '' });
      } else {
        alert('Failed to add student');
      }
    } catch (error) {
      console.error(error);
      alert('Error adding student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Audition Judging</h1>
      <p className="subtitle">Select an instrument to begin judging</p>
      
      <div className="grid-container">
        {instruments.map(instrument => (
          <Link href={`/${instrument.toLowerCase()}`} key={instrument} className="glass-card">
            <h2>{instrument}</h2>
          </Link>
        ))}
      </div>
      
      <div style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => setShowModal(true)} className="btn btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '1rem 2rem' }}>
          Add New Student
        </button>
        <Link href="/results" className="btn" style={{ display: 'inline-block', width: 'auto', padding: '1rem 2rem' }}>
          View All Results
        </Link>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Add New Student</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="form-label"><label>First Name</label></div>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label"><label>Last Name</label></div>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label"><label>Instrument</label></div>
                <select value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})}>
                  {instruments.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label"><label>Grade</label></div>
                <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  {[6, 7, 8].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label"><label>Student Placement (Optional)</label></div>
                <select value={formData.studentPlacement} onChange={e => setFormData({...formData, studentPlacement: e.target.value})}>
                  <option value="">-- Select --</option>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label"><label>Rehearsal Skills (Optional)</label></div>
                <select value={formData.rehearsalSkills} onChange={e => setFormData({...formData, rehearsalSkills: e.target.value})}>
                  <option value="">-- Select --</option>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Student'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
