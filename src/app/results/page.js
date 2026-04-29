"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './results.css';
import { getSchemaForInstrument } from '@/lib/schema';

const instrumentsList = [
  'All', 'Flute', 'Oboe', 'Bassoon', 'Clarinet', 'Saxophone', 
  'Trumpet', 'Horn', 'Trombone', 'Euphonium', 'Tuba', 'Percussion'
];

const MINIMAL_BANDS = [
  { name: 'Honor Band', className: 'minimal-bg-honor' },
  { name: 'Symphonic Band', className: 'minimal-bg-symphonic' },
  { name: 'Concert Band', className: 'minimal-bg-concert' },
  { name: 'Intermediate Band', className: 'minimal-bg-intermediate' }
];

export default function ResultsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMinimalView, setIsMinimalView] = useState(false);
  const [instrumentFilter, setInstrumentFilter] = useState([]); // Empty = All
  const [bandFilter, setBandFilter] = useState([]); // Empty = All
  
  const [instOpen, setInstOpen] = useState(false);
  const [bandOpen, setBandOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    if (student) {
      setEditForm({
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        studentPlacement: student.studentPlacement || '',
        rehearsalSkills: student.rehearsalSkills || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedStudent = await res.json();
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        setSelectedStudent(updatedStudent);
        setIsEditing(false);
      } else {
        alert('Failed to update student');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setStudents(prev => prev.filter(s => s.id !== id));
          setSelectedStudent(null);
        } else {
          alert('Failed to delete student');
        }
      } catch (e) {
        console.error(e);
        alert('An error occurred');
      }
    }
  };

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    // Fetch immediately on load
    fetchStudents();
    
    // Poll for updates every 5 seconds
    const intervalId = setInterval(fetchStudents, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const BANDS = [null, 'Honor Band', 'Symphonic Band', 'Concert Band', 'Intermediate Band'];

  const handleCardClick = async (student) => {
    const currentIndex = BANDS.indexOf(student.bandPlacement || null);
    const nextIndex = (currentIndex + 1) % BANDS.length;
    const newBand = BANDS[nextIndex];
    
    // Optimistic UI update
    setStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, bandPlacement: newBand } : s
    ));
    
    // Sync with backend
    try {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandPlacement: newBand })
      });
    } catch (e) {
      console.error('Failed to update band placement', e);
    }
  };

  const handleIntegrityToggle = async (e, student) => {
    e.stopPropagation();
    const newValue = !student.auditionIntegrity;
    
    setStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, auditionIntegrity: newValue } : s
    ));
    
    try {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditionIntegrity: newValue })
      });
    } catch (e) {
      console.error('Failed to update audition integrity', e);
    }
  };

  // totalScore is now pre-calculated by the backend

  const getScoredCount = (scores, instrument) => {
    if (!scores) return 0;
    const schema = getSchemaForInstrument(instrument);
    return Object.keys(schema).filter(sel => scores[sel]).length;
  };

  // Group and sort students
  const groupedStudents = {};
  
  students.forEach(student => {
    if (instrumentFilter.length > 0 && !instrumentFilter.includes(student.instrument)) return;
    
    if (bandFilter.length > 0) {
      const b = student.bandPlacement || 'Unplaced';
      if (!bandFilter.includes(b)) return;
    }
    
    if (!groupedStudents[student.instrument]) {
      groupedStudents[student.instrument] = [];
    }
    
    const schema = getSchemaForInstrument(student.instrument);
    const totalSelections = Object.keys(schema).length;
    const scoredCount = getScoredCount(student.scores, student.instrument);
    let status = 'not-started';
    if (scoredCount === totalSelections) status = 'evaluated';
    else if (scoredCount > 0) status = 'pending';

    const totalScore = student.totalScore || 0;
    
    groupedStudents[student.instrument].push({
      ...student,
      totalScore,
      status,
      scoredCount,
      totalSelections,
      bandPlacement: student.bandPlacement || null
    });
  });

  // Sort within each instrument: Evaluated first, then Pending, then Not Started. Then by score DESC.
  Object.keys(groupedStudents).forEach(inst => {
    groupedStudents[inst].sort((a, b) => {
      const statusOrder = { 'evaluated': 1, 'pending': 2, 'not-started': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.totalScore - a.totalScore;
    });

    let currentRank = 1;
    groupedStudents[inst].forEach(student => {
      student.placementRank = student.status === 'evaluated' ? currentRank++ : '-';
    });
  });

  if (loading) return <div className="app-container"><p className="subtitle">Loading results...</p></div>;

  return (
    <div className="results-page">
      <div className="results-header" style={{ position: 'relative' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsMinimalView(!isMinimalView)}
          style={{ position: 'absolute', top: 0, right: 0, padding: '0.25rem 0.5rem', fontSize: '0.75rem', margin: 0, width: 'auto' }}
        >
          {isMinimalView ? 'Detailed View' : 'Minimalistic View'}
        </button>
        <Link href="/" className="back-link">&larr; Back to Home</Link>
        <h1>Audition Results</h1>
        
        <div className="filter-bar">
          <div className="custom-dropdown">
            <button className="dropdown-button" onClick={() => setInstOpen(!instOpen)}>
              Instruments ({instrumentFilter.length === 0 ? 'All' : instrumentFilter.length}) ▾
            </button>
            {instOpen && (
              <div className="dropdown-menu">
                <label>
                  <input 
                    type="checkbox" 
                    checked={instrumentFilter.length === 0} 
                    onChange={() => setInstrumentFilter([])} 
                  /> All Instruments
                </label>
                {instrumentsList.slice(1).map(inst => (
                  <label key={inst}>
                    <input 
                      type="checkbox" 
                      checked={instrumentFilter.includes(inst)} 
                      onChange={(e) => {
                        if (e.target.checked) setInstrumentFilter([...instrumentFilter, inst]);
                        else setInstrumentFilter(instrumentFilter.filter(i => i !== inst));
                      }} 
                    /> {inst}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="custom-dropdown">
            <button className="dropdown-button" onClick={() => setBandOpen(!bandOpen)}>
              Bands ({bandFilter.length === 0 ? 'All' : bandFilter.length}) ▾
            </button>
            {bandOpen && (
              <div className="dropdown-menu">
                <label>
                  <input 
                    type="checkbox" 
                    checked={bandFilter.length === 0} 
                    onChange={() => setBandFilter([])} 
                  /> All Bands
                </label>
                {[...BANDS.slice(1), 'Unplaced'].map(band => (
                  <label key={band}>
                    <input 
                      type="checkbox" 
                      checked={bandFilter.includes(band)} 
                      onChange={(e) => {
                        if (e.target.checked) setBandFilter([...bandFilter, band]);
                        else setBandFilter(bandFilter.filter(b => b !== band));
                      }} 
                    /> {band}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMinimalView ? (
        <div className="minimal-view-container">
          {MINIMAL_BANDS.map(band => (
            <div key={band.name} className="minimal-row">
              <div className={`minimal-row-title ${band.className}`}>
                <h2>{band.name}</h2>
              </div>
              <div className="minimal-columns-container">
                {instrumentsList.slice(1).map(instrument => {
                  const instStudents = (groupedStudents[instrument] || []).filter(s => s.bandPlacement === band.name);
                  
                  return (
                    <div key={instrument} className="minimal-column">
                      <div className="minimal-column-header">{instrument}</div>
                      <div className="minimal-students">
                        {instStudents.map(student => (
                          <div key={student.id} className="minimal-student-box">
                            <span className="minimal-name">
                              {student.firstName} {student.lastName} <span className="minimal-grade">({student.grade})</span>
                            </span>
                            <span className="minimal-score">{student.totalScore || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="columns-container">
        {instrumentsList.slice(1).filter(inst => groupedStudents[inst]).map(instrument => (
          <div key={instrument} className="instrument-column">
            <h2 className="column-title">{instrument}</h2>
            <div className="students-list">
              {groupedStudents[instrument].map(student => {
                const bandClass = student.bandPlacement ? `band-${student.bandPlacement.split(' ')[0].toLowerCase()}` : '';
                return (
                  <div 
                    key={student.id} 
                    className={`student-result-card card-${student.status} ${bandClass}`}
                    onClick={() => handleCardClick(student)}
                  >
                    <div className="student-result-header">
                      <div>
                        <span className="student-number">#{student.number}</span>
                        <span className="student-name">{student.firstName} {student.lastName}</span>
                      </div>
                      <button 
                        className="settings-btn" 
                        onClick={(e) => { e.stopPropagation(); handleSelectStudent(student); }}
                        title="Settings"
                      >
                        ⚙️
                      </button>
                    </div>
                  <div className="student-score">
                    {student.grade} | S. placement: <strong>{student.studentPlacement || '-'}</strong>
                    <br/>
                    Rehearsal Skills: <strong>{student.rehearsalSkills || '-'}</strong>
                  </div>
                  
                  <div className="card-footer">
                    <input
                      type="checkbox"
                      className="integrity-checkbox"
                      checked={student.auditionIntegrity || false}
                      onChange={(e) => handleIntegrityToggle(e, student)}
                      onClick={(e) => e.stopPropagation()}
                      title="Audition Integrity"
                    />
                    <div className="total-score-large" title="Total Score">
                      {student.totalScore}
                    </div>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="score-tooltip">
                    <h4>Score Breakdown</h4>
                    {Object.keys(getSchemaForInstrument(student.instrument)).map(sel => {
                      const selScores = student.scores?.[sel];
                      if (!selScores) return <div key={sel} className="breakdown-section"><strong>{sel}:</strong> Pending</div>;
                      
                      return (
                        <div key={sel} className="breakdown-section">
                          <strong>{sel}</strong>
                          <ul>
                            {getSchemaForInstrument(student.instrument)[sel].map(cat => (
                              <li key={cat}>{cat}: {selScores[cat]?.score || 0} <em>({selScores[cat]?.comment || 'none'})</em></li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        ))}
        {Object.keys(groupedStudents).length === 0 && (
          <p className="subtitle">No students found.</p>
        )}
      </div>
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => handleSelectStudent(null)}>
          <div className="modal-content glass-panel student-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>{isEditing ? "Edit Student Information" : "Student Information"}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link href={`/${selectedStudent.instrument.toLowerCase()}/${selectedStudent.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}>
                  Edit Scoring
                </Link>
                <button className="settings-btn" onClick={() => setIsEditing(!isEditing)} title="Edit Info" style={{ margin: 0 }}>
                  ✏️
                </button>
                <button className="close-x-btn" onClick={() => handleSelectStudent(null)} title="Close">
                  &times;
                </button>
              </div>
            </div>
            
            <div className="settings-info">
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>First Name</label>
                    <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Last Name</label>
                    <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Grade</label>
                    <select value={editForm.grade} onChange={e => setEditForm({...editForm, grade: e.target.value})}>
                      {[6, 7, 8].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Student Placement</label>
                    <input type="text" value={editForm.studentPlacement} onChange={e => setEditForm({...editForm, studentPlacement: e.target.value})} placeholder="Optional" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rehearsal Skills (1-4)</label>
                    <select value={editForm.rehearsalSkills} onChange={e => setEditForm({...editForm, rehearsalSkills: e.target.value})}>
                      <option value="">-</option>
                      {[1, 2, 3, 4].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button className="btn" onClick={handleSaveEdit} style={{ marginTop: '1rem' }}>Save Changes</button>
                </div>
              ) : (
                <>
                  <p><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p><strong>Instrument:</strong> {selectedStudent.instrument}</p>
                  <p><strong>Grade:</strong> {selectedStudent.grade}</p>
                  <p><strong>Band Placement:</strong> {selectedStudent.bandPlacement || 'None'}</p>
                  <p><strong>Student Placement:</strong> {selectedStudent.studentPlacement || 'None'}</p>
                  <p><strong>Total Score:</strong> {selectedStudent.totalScore}</p>
                </>
              )}
            </div>
            
            {selectedStudent.scoredCount > 0 && (
              <>
                <hr className="settings-divider" />
                
                <h2>Score Breakdown</h2>
                <div className="settings-scores">
                  {Object.keys(getSchemaForInstrument(selectedStudent.instrument)).map(sel => {
                    const selScores = selectedStudent.scores?.[sel];
                    if (!selScores) return <div key={sel} className="settings-breakdown-section"><h3>{sel}</h3><p>Pending</p></div>;
                    
                    return (
                      <div key={sel} className="settings-breakdown-section">
                        <h3>{sel}</h3>
                        <ul>
                          {getSchemaForInstrument(selectedStudent.instrument)[sel].map(cat => (
                            <li key={cat}>
                              <strong>{cat}:</strong> {selScores[cat]?.score || 0}
                              {selScores[cat]?.comment && <p className="comment-text">"{selScores[cat].comment}"</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-delete" onClick={() => handleDelete(selectedStudent.id)} style={{ width: '50%' }}>
                DELETE STUDENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
