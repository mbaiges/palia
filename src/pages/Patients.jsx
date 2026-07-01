import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Patients({ onViewDetail, onNewPatient, searchVal }) {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [localQuery, setLocalQuery] = useState('');

  const patients = dbService.getPatients();
  const hospitals = dbService.getHospitals();

  const getHospitalName = (id) => {
    const h = hospitals.find(hosp => hosp.id === id);
    return h ? h.name : 'No asignado';
  };

  // Combine parent search value (from Header) and local filters
  const filteredPatients = patients.filter(p => {
    const query = (searchVal || localQuery || '').toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(query) || 
                         p.diagnosis.toLowerCase().includes(query) ||
                         p.dni.toLowerCase().includes(query);
                         
    const matchesStatus = filterStatus === 'Todos' || 
                          (filterStatus === 'Estable' && p.currentStatus === 'Estable') ||
                          (filterStatus === 'En Observación' && p.currentStatus === 'En Observación') ||
                          (filterStatus === 'Alerta' && p.currentStatus === 'Alerta');

    return matchesQuery && matchesStatus;
  });

  const getStatusChipClass = (status) => {
    switch (status) {
      case 'Estable': return 'chip-success';
      case 'En Observación': return 'chip-warning';
      case 'Alerta': return 'chip-error';
      default: return 'chip-info';
    }
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
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'var(--color-on-background)' }}>Directorio de Pacientes</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Gestión y seguimiento del estado actual de los acompañamientos.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onNewPatient}>
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Filter and Local Search Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['Todos', 'Estable', 'En Observación', 'Alerta'].map(status => (
            <button
              key={status}
              className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-tertiary'}`}
              style={{ height: '36px', padding: '0 16px', borderRadius: 'var(--radius-full)' }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)' }}>filter_list</span>
          <input
            type="text"
            placeholder="Filtrar por nombre..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            style={{ width: '100%', height: '38px', paddingLeft: '40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Patient Grid */}
      <div className="bento-grid">
        {filteredPatients.length === 0 ? (
          <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '40px', color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>search_off</span>
            <p style={{ marginTop: '12px' }}>No se encontraron pacientes con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const isAlert = patient.currentStatus === 'Alerta';
            return (
              <div 
                key={patient.id} 
                className={`card ${isAlert ? 'pulse-alert-card' : ''}`}
                style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Card Header Section */}
                <div className={`card-header-gradient ${isAlert ? 'card-header-gradient-error' : ''}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: 'var(--radius-full)', 
                      backgroundColor: isAlert ? 'var(--color-error-container)' : 'var(--color-secondary-container)', 
                      color: isAlert ? 'var(--color-error)' : 'var(--color-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '18px'
                    }}>
                      {getInitials(patient.name)}
                    </div>
                  </div>
                  <span className={`chip ${getStatusChipClass(patient.currentStatus)}`}>
                    {patient.currentStatus === 'Alerta' ? 'Situación compleja' : patient.currentStatus}
                  </span>
                </div>

                {/* Patient Information */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <h3 style={{ color: 'var(--color-on-surface)' }}>{patient.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-outline)' }}>ID: {patient.dni}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid rgba(111,120,125,0.1)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--color-on-surface-variant)' }}>Hospital:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right' }}>{getHospitalName(patient.hospitalId)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--color-on-surface-variant)' }}>Diagnóstico:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={patient.diagnosis}>
                        {patient.diagnosis}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)', display: 'flex', gap: '10px' }}>
                  <button 
                    className={`btn ${isAlert ? 'btn-error' : 'btn-primary'}`} 
                    style={{ flexGrow: 1 }}
                    onClick={() => onViewDetail(patient.id)}
                  >
                    {isAlert ? '⚠ Atención Urgente' : 'Ver Ficha'}
                  </button>
                  <button 
                    className="btn btn-tertiary" 
                    style={{ padding: '0 12px' }}
                    aria-label="Abrir ficha del paciente"
                    onClick={() => onViewDetail(patient.id)}
                  >
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)' }}>open_in_new</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
