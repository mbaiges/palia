import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Volunteers({ searchVal }) {
  const volunteers = dbService.getVolunteers();
  const patients = dbService.getPatients();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVolunteers = volunteers.filter(v => {
    const query = (searchVal || searchQuery || '').toLowerCase();
    const nameMatch = v.name ? v.name.toLowerCase().includes(query) : false;
    const emailMatch = v.email ? v.email.toLowerCase().includes(query) : false;
    const specialtyMatch = v.specialty ? v.specialty.toLowerCase().includes(query) : false;
    return nameMatch || emailMatch || specialtyMatch;
  });

  const getAssignedPatientNames = (volunteerId) => {
    const assigned = patients.filter(p => p.assignedVolunteers.includes(volunteerId));
    if (assigned.length === 0) return 'Ninguno asignado';
    return assigned.map(p => p.name).join(', ');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'var(--color-on-background)' }}>Comunidad de Voluntarios</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Miembros activos que realizan acompañamientos paliativos.</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)' }}>search</span>
          <input
            type="text"
            placeholder="Buscar voluntario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: '38px', paddingLeft: '40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Volunteer Bento Grid */}
      <div className="bento-grid">
        {filteredVolunteers.length === 0 ? (
          <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '40px', color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>group_off</span>
            <p style={{ marginTop: '12px' }}>No se encontraron voluntarios.</p>
          </div>
        ) : (
          filteredVolunteers.map(vol => (
            <div key={vol.id} className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: 'var(--radius-full)', 
                  backgroundColor: 'var(--color-secondary-container)', 
                  color: 'var(--color-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {getInitials(vol.name)}
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-on-surface)' }}>{vol.name}</h3>
                  <span className={`chip ${vol.status === 'Activo' ? 'chip-success' : 'chip-warning'}`} style={{ fontSize: '11px', marginTop: '2px' }}>
                    {vol.status}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>Teléfono:</span>
                  <span style={{ fontWeight: 500 }}>{vol.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>Email:</span>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={vol.email}>
                    {vol.email}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--color-outline-variant)' }}>
                  <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Pacientes Asignados:</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{getAssignedPatientNames(vol.id)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
