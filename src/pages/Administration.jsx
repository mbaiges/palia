import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Administration() {
  const [patients, setPatients] = useState(dbService.getPatients());
  const [volunteers, setVolunteers] = useState(dbService.getVolunteers());
  const [hospitals, setHospitals] = useState(dbService.getHospitals());

  // Volunteer Assignment form states
  const [assignPatientId, setAssignPatientId] = useState(patients[0]?.id || '');
  const [assignVolId, setAssignVolId] = useState(volunteers[0]?.id || '');
  
  // Hospital Form states
  const [newHospName, setNewHospName] = useState('');
  const [newHospAddress, setNewHospAddress] = useState('');

  // Msg feedback
  const [assignMsg, setAssignMsg] = useState('');
  const [hospMsg, setHospMsg] = useState('');

  const handleAssign = (e) => {
    e.preventDefault();
    if (!assignPatientId || !assignVolId) return;

    try {
      dbService.assignVolunteerToPatient(assignPatientId, assignVolId);
      // Reload list from storage
      setPatients(dbService.getPatients());
      setAssignMsg('Asignación realizada con éxito.');
      setTimeout(() => setAssignMsg(''), 3000);
    } catch (err) {
      setAssignMsg('Error: ' + err.message);
    }
  };

  const handleAddHospital = (e) => {
    e.preventDefault();
    if (!newHospName.trim() || !newHospAddress.trim()) return;

    try {
      dbService.saveHospital({ name: newHospName.trim(), address: newHospAddress.trim() });
      setHospitals(dbService.getHospitals());
      setNewHospName('');
      setNewHospAddress('');
      setHospMsg('Hospital agregado con éxito.');
      setTimeout(() => setHospMsg(''), 3000);
    } catch (err) {
      setHospMsg('Error: ' + err.message);
    }
  };

  const getVolunteerNames = (ids) => {
    if (!ids || ids.length === 0) return 'Ninguno asignado';
    return ids.map(id => {
      const v = volunteers.find(vol => vol.id === id);
      return v ? v.name : id;
    }).join(', ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--color-on-background)' }}>Panel de Administración</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Gestión interna, asignaciones de voluntarios y catálogo de centros de salud.</p>
      </div>

      <div className="bento-grid">
        {/* Left Column: Volunteer Assignment */}
        <div className="card" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>handshake</span>
            <h2 style={{ fontSize: '20px' }}>Asignación de Voluntarios</h2>
          </div>

          <form onSubmit={handleAssign} className="form-section">
            <div className="form-group">
              <label>Seleccionar Paciente</label>
              <select value={assignPatientId} onChange={(e) => setAssignPatientId(e.target.value)}>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.dni})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Seleccionar Voluntario</label>
              <select value={assignVolId} onChange={(e) => setAssignVolId(e.target.value)}>
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.status})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '8px' }}>
              <span className="material-symbols-outlined">link</span>
              Asignar Acompañante
            </button>
            {assignMsg && (
              <p style={{ marginTop: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>{assignMsg}</p>
            )}
          </form>

          {/* Current Assignments Table */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px' }}>Listado de Asignaciones Activas</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', color: 'var(--color-on-surface-variant)' }}>Paciente</th>
                    <th style={{ padding: '8px 4px', color: 'var(--color-on-surface-variant)' }}>Voluntarios</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '8px 4px', color: 'var(--color-primary)' }}>{getVolunteerNames(p.assignedVolunteers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Hospital Management */}
        <div className="card" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-secondary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'rgba(75, 100, 80, 0.1)', color: 'var(--color-secondary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>domain</span>
            <h2 style={{ fontSize: '20px' }}>Centros de Salud de Derivación</h2>
          </div>

          {/* List of Hospitals */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
            {hospitals.map(h => (
              <div key={h.id} style={{ borderBottom: '1px dashed var(--color-outline-variant)', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-on-surface)' }}>{h.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>{h.address}</span>
              </div>
            ))}
          </div>

          {/* Add Hospital Form */}
          <form onSubmit={handleAddHospital} className="form-section" style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--color-on-surface)', marginBottom: '12px' }}>Registrar Nuevo Centro</h3>
            <div className="form-group">
              <label>Nombre del Centro *</label>
              <input
                type="text"
                placeholder="Ej: Hospital Clínico San Carlos"
                value={newHospName}
                onChange={(e) => setNewHospName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Dirección / Ubicación *</label>
              <input
                type="text"
                placeholder="Ej: Av. Córdoba 2351, CABA, Argentina"
                value={newHospAddress}
                onChange={(e) => setNewHospAddress(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-secondary" type="submit" style={{ marginTop: '8px' }}>
              <span className="material-symbols-outlined">add</span>
              Agregar Hospital
            </button>
            {hospMsg && (
              <p style={{ marginTop: '12px', color: 'var(--color-secondary)', fontWeight: 700 }}>{hospMsg}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
