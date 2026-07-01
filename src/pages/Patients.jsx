import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Patients({ onViewDetail, onNewPatient, searchVal }) {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [localQuery, setLocalQuery] = useState('');

  const allPatients = dbService.getPatients();
  const hospitals = dbService.getHospitals();

  const getHospitalName = (id) => {
    const h = hospitals.find(hosp => hosp.id === id);
    return h ? h.name : 'No asignado';
  };

  const getCaregiverRelation = (patientId) => {
    if (dbService.getCaregiverForPatient) {
      const cg = dbService.getCaregiverForPatient(patientId);
      return cg ? cg.relation : 'Familiar';
    }
    return 'Familiar';
  };

  const filteredPatients = allPatients.filter(p => {
    const query = (searchVal || localQuery || '').toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(query) ||
      p.diagnosis.toLowerCase().includes(query) ||
      (p.dni || '').toLowerCase().includes(query);
    
    const matchesStatus =
      filterStatus === 'Todos' ||
      (filterStatus === 'Crítico' && p.currentStatus === 'Alerta') ||
      (filterStatus === 'Observación' && p.currentStatus === 'En Observación') ||
      (filterStatus === 'Estable' && p.currentStatus === 'Estable');
    return matchesQuery && matchesStatus;
  });

  const counts = {
    total: allPatients.length,
    critico: allPatients.filter(p => p.currentStatus === 'Alerta').length,
    alerta: allPatients.filter(p => p.currentStatus === 'En Observación').length,
    estable: allPatients.filter(p => p.currentStatus === 'Estable').length,
  };

  const getInitials = (name) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const StatusChip = ({ status }) => {
    const styles = {
      Alerta: { bg: 'var(--color-error)', color: 'white', label: '! Crítico' },
      'En Observación': { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', label: '⚠ Observación' },
      Estable: { bg: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', label: '✓ Estable' },
    };
    const s = styles[status] || { bg: 'var(--color-surface-container)', color: 'var(--color-on-surface)', label: status };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '4px 12px', borderRadius: 'var(--radius-full)',
        fontSize: '13px', fontWeight: 600,
        backgroundColor: s.bg, color: s.color,
      }}>
        {s.label}
      </span>
    );
  };

  const StatCard = ({ label, value, icon, color, bg, borderColor, filterKey }) => (
    <button
      onClick={() => setFilterStatus(filterKey)}
      style={{
        padding: '16px', borderRadius: 'var(--radius-xl)',
        backgroundColor: filterStatus === filterKey ? bg : 'var(--color-surface)',
        border: `1.5px solid ${filterStatus === filterKey ? borderColor : 'var(--color-outline-variant)'}`,
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
        flex: '1 1 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span className="material-symbols-outlined" style={{ padding: '8px', backgroundColor: bg, color, borderRadius: 'var(--radius-md)', fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</span>
      </div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>{label}</p>
      <div style={{ marginTop: '10px', height: '3px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-surface-container-high)' }}>
        <div style={{ height: '100%', borderRadius: 'var(--radius-full)', backgroundColor: borderColor, width: `${counts.total > 0 ? (value / counts.total * 100) : 0}%` }} />
      </div>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>

      {/* 💻 DESKTOP ONLY VIEW */}
      <div className="desktop-only">
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--color-on-background)' }}>Directorio de Pacientes</h1>
            <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
              Gestiona y supervisa el estado de todos los pacientes asignados.
            </p>
          </div>
          <button className="btn btn-primary" onClick={onNewPatient} style={{ gap: '8px' }}>
            <span className="material-symbols-outlined">person_add</span>
            Añadir Nuevo Paciente
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <StatCard label="Todos los Pacientes" value={counts.total} icon="groups" color="var(--color-primary)" bg="var(--color-primary-container)" borderColor="var(--color-primary)" filterKey="Todos" />
          <StatCard label="Situación Crítica" value={counts.critico} icon="priority_high" color="var(--color-error)" bg="var(--color-error-container)" borderColor="var(--color-error)" filterKey="Crítico" />
          <StatCard label="Alertas Activas" value={counts.alerta} icon="warning" color="var(--color-secondary)" bg="var(--color-secondary-container)" borderColor="var(--color-secondary)" filterKey="Observación" />
          <StatCard label="Estables" value={counts.estable} icon="check_circle" color="#4b6450" bg="#cdead0" borderColor="#4b6450" filterKey="Estable" />
        </div>

        {/* Table container */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Table search row */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: '18px' }}>search</span>
              <input
                type="text"
                placeholder="Filtrar por nombre, DNI o diagnóstico..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                style={{ width: '100%', height: '40px', paddingLeft: '40px', paddingRight: '12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-outline-variant)', outline: 'none', fontSize: '14px', backgroundColor: 'var(--color-surface-container-low)', boxSizing: 'border-box' }}
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
              Mostrando {filteredPatients.length} de {counts.total} pacientes
            </span>
          </div>

          {/* Table body */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                  {['Paciente', 'DNI / ID', 'Estado', 'Cuidador / Familiar', 'Última Visita', 'Acciones'].map((col, i) => (
                    <th key={col} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)', borderBottom: '1px solid var(--color-outline-variant)', textAlign: i === 5 ? 'right' : 'left' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)', display: 'block', marginBottom: '12px' }}>search_off</span>
                      No se encontraron pacientes con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, idx) => {
                    const isAlert = patient.currentStatus === 'Alerta';
                    return (
                      <tr
                        key={patient.id}
                        style={{
                          borderBottom: idx < filteredPatients.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                          backgroundColor: isAlert ? 'rgba(186,26,26,0.03)' : 'transparent',
                          transition: 'background-color 0.12s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isAlert ? 'rgba(186,26,26,0.03)' : 'transparent'}
                        onClick={() => onViewDetail(patient.id)}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                              backgroundColor: isAlert ? 'var(--color-error)' : 'var(--color-secondary-container)',
                              color: isAlert ? 'white' : 'var(--color-secondary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '15px',
                            }}>
                              {getInitials(patient.name)}
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>{patient.name}</p>
                              <p style={{ fontSize: '12px', color: 'var(--color-outline)', margin: 0, marginTop: '2px' }}>{patient.diagnosis}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-on-surface)', fontFamily: 'monospace' }}>
                          {patient.dni || '—'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <StatusChip status={patient.currentStatus} />
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface)', margin: 0 }}>{patient.caregiverName || '—'}</p>
                          <p style={{ fontSize: '12px', color: 'var(--color-outline)', margin: 0, marginTop: '2px' }}>{patient.caregiverPhone || ''}</p>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ fontSize: '14px', color: 'var(--color-on-surface)', margin: 0 }}>{patient.lastVisit || '—'}</p>
                          {isAlert && <p style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600, margin: 0, marginTop: '2px' }}>Alerta activa</p>}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            className="icon-btn"
                            aria-label="Ver ficha"
                            onClick={(e) => { e.stopPropagation(); onViewDetail(patient.id); }}
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="icon-btn" aria-label="Más opciones" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--color-on-surface-variant)' }}>
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
              Mostrando 1 a {filteredPatients.length} de {filteredPatients.length} pacientes
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-tertiary" style={{ width: '36px', height: '36px', padding: 0, fontSize: '18px' }} disabled>‹</button>
              <button className="btn btn-primary" style={{ width: '36px', height: '36px', padding: 0, fontSize: '14px' }}>1</button>
              <button className="btn btn-tertiary" style={{ width: '36px', height: '36px', padding: 0, fontSize: '18px' }} disabled>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE ONLY VIEW (Strict alignment with mock: directorio_de_pacientes.html) */}
      <div className="mobile-only" style={{ padding: '0 4px' }}>
        {/* Search & Filter section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)' }}>search</span>
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              style={{
                width: '100%', height: '48px', paddingLeft: '48px', paddingRight: '16px',
                borderRadius: '12px', border: '1px solid var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container-lowest)', outline: 'none',
                fontSize: '15px', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Horizontal scrollable filter chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setFilterStatus('Todos')}
              className="font-label-md"
              style={{
                padding: '8px 16px', borderRadius: '9999px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                backgroundColor: filterStatus === 'Todos' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                color: filterStatus === 'Todos' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                fontWeight: 600, fontSize: '13px'
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('Crítico')}
              className="font-label-md"
              style={{
                padding: '8px 16px', borderRadius: '9999px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: filterStatus === 'Crítico' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                color: filterStatus === 'Crítico' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                fontWeight: 600, fontSize: '13px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-error)' }}></span>
              Crítico
            </button>
            <button
              onClick={() => setFilterStatus('Observación')}
              className="font-label-md"
              style={{
                padding: '8px 16px', borderRadius: '9999px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: filterStatus === 'Observación' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                color: filterStatus === 'Observación' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                fontWeight: 600, fontSize: '13px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }}></span>
              Alertas
            </button>
            <button
              onClick={() => setFilterStatus('Estable')}
              className="font-label-md"
              style={{
                padding: '8px 16px', borderRadius: '9999px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: filterStatus === 'Estable' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                color: filterStatus === 'Estable' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                fontWeight: 600, fontSize: '13px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4b6450' }}></span>
              Estables
            </button>
          </div>
        </div>

        {/* Patient list matching mobile mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>search_off</span>
              <p style={{ marginTop: '8px' }}>No hay pacientes asignados.</p>
            </div>
          ) : (
            filteredPatients.map(patient => {
              const isAlert = patient.currentStatus === 'Alerta';
              return (
                <article
                  key={patient.id}
                  onClick={() => onViewDetail(patient.id)}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    border: isAlert ? '2px solid var(--color-error)' : '1px solid var(--color-outline-variant)',
                    borderRadius: '12px', padding: '16px', cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  {/* Top: Name, DNI and Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{patient.name}</h2>
                      <span style={{ fontSize: '12px', color: 'var(--color-outline)', marginTop: '2px' }}>DNI: {patient.dni}</span>
                    </div>
                    {isAlert ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                        <span style={{
                          backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)',
                          fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                          SITUACIÓN COMPLEJA
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-error)', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Prioridad Alta</span>
                      </div>
                    ) : (
                      <span style={{
                        backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)',
                        fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px'
                      }}>
                        {patient.currentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Body details with icons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {isAlert ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emergency</span>
                        <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Alerta: Dolor no controlado</p>
                        <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>Alerta activa</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                        <p style={{ fontSize: '13px', margin: 0 }}>Sin alertas activas</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_pin</span>
                      <p style={{ fontSize: '13px', margin: 0 }}>
                        Cuidador: {patient.caregiverName || 'Sin registrar'} ({getCaregiverRelation(patient.id)})
                      </p>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {isAlert ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewDetail(patient.id); }}
                          style={{
                            height: '40px', padding: '0 16px', borderRadius: '8px', border: 'none',
                            backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-primary)',
                            fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                          Historial
                        </button>
                        <a
                          href={`tel:${patient.caregiverPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            height: '40px', padding: '0 16px', borderRadius: '8px', border: 'none', textDecoration: 'none',
                            backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)',
                            fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                          Llamar
                        </a>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '11px', color: 'var(--color-outline)', fontStyle: 'italic', marginRight: 'auto', alignSelf: 'center' }}>
                          Última visita: {patient.lastVisit || '—'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewDetail(patient.id); }}
                          style={{
                            height: '36px', padding: '0 16px', borderRadius: '8px', border: 'none',
                            backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-primary)',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                          }}
                        >
                          Expediente
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Floating Contextual FAB for mobile new patient */}
        <button
          onClick={onNewPatient}
          aria-label="Añadir nuevo paciente"
          style={{
            position: 'fixed', bottom: '92px', right: '16px', height: '56px',
            backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)',
            borderRadius: '16px', border: 'none', padding: '0 20px', zIndex: 40,
            boxShadow: '0 4px 14px rgba(0, 90, 113, 0.25)', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person_add</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Nuevo Paciente</span>
        </button>
      </div>

    </div>
  );
}
