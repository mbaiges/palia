import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import AlertModal from '../components/AlertModal';
import PrintReportPreview from '../components/PrintReportPreview';

export default function PatientDetail({ patientId, onBack, onNewFollowUp }) {
  const [patientState, setPatientState] = useState(() => dbService.getPatient(patientId));
  const [followUpsState, setFollowUpsState] = useState(() => dbService.getFollowUpsForPatient(patientId));
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    setPatientState(dbService.getPatient(patientId));
    setFollowUpsState(dbService.getFollowUpsForPatient(patientId));
  }, [patientId]);

  const patient = patientState;
  const caregiver = dbService.getCaregiverForPatient(patientId);
  const followUps = followUpsState;
  const hospitals = dbService.getHospitals();

  const handleAlertSubmit = (alertData) => {
    // Generate follow-up event
    const newEvent = {
      patientId: patient.id,
      authorId: 'admin',
      authorName: 'Coordinador Central',
      contactType: 'Presencial',
      symptoms: {
        pain: alertData.motive.includes('Dolor') ? '10 - Insoportable' : '1-3 - Leve',
        nausea: alertData.motive.includes('Náusea') ? 'Persistente' : 'Ninguno',
        gradient: 'none',
        dyspnea: alertData.motive.includes('Disnea') ? 'Grado 3 - Severa' : 'Grado 0 - Normal'
      },
      symptomObservations: `🚨 Alerta Clínica [${alertData.motive}]: ${alertData.observations}`,
      socialRisk: {
        familySupport: 'Sólido y constante',
        environmentNotes: 'Alerta gatillada desde el panel coordinador.'
      },
      equipmentNeeds: [],
      equipmentOther: "",
      interventions: `Activación de red médica de emergencia. Motivo: ${alertData.motive}.`,
      alertActivated: true
    };

    dbService.saveFollowUp(newEvent);
    // Reload local state
    setPatientState(dbService.getPatient(patientId));
    setFollowUpsState(dbService.getFollowUpsForPatient(patientId));
  };

  if (!patient) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Paciente no encontrado</h2>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '20px' }}>Volver</button>
      </div>
    );
  }

  const getHospitalName = (id) => {
    const h = hospitals.find(hosp => hosp.id === id);
    return h ? h.name : 'No asignado';
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={onBack} aria-label="Volver al listado">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>arrow_back</span>
          </button>
          <div>
            <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-outline)' }}>
              <span style={{ cursor: 'pointer' }} onClick={onBack}>Pacientes</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', margin: '0 4px' }}>chevron_right</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Ficha Médica</span>
            </nav>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onNewFollowUp} style={{ gap: '6px' }}>
            <span className="material-symbols-outlined">edit_note</span>
            Registrar Seguimiento
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsAlertModalOpen(true)} 
            style={{ 
              backgroundColor: 'var(--color-error-container)', 
              color: 'var(--color-error)', 
              borderColor: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
            Activar Alerta
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsPrintModalOpen(true)} 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            Imprimir Historial
          </button>
        </div>
      </div>

      {/* Patient Identity Profile Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: 'var(--radius-full)', 
          backgroundColor: 'var(--color-primary-container)', 
          color: 'var(--color-on-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>person</span>
        </div>
        <div>
          <h1 style={{ color: 'var(--color-on-background)', fontSize: '28px' }}>{patient.name}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span className="chip chip-info">DNI: {patient.dni}</span>
            {patient.currentStatus === 'Alerta' && (
              <span className="chip chip-error">Situación compleja</span>
            )}
            {patient.currentStatus === 'En Observación' && (
              <span className="chip chip-warning">En Observación</span>
            )}
            {patient.currentStatus === 'Estable' && (
              <span className="chip chip-success">Estable</span>
            )}
          </div>
        </div>
      </div>

      {/* Bento Profile Detail Grid */}
      <div className="bento-grid">
        {/* Ficha Clinica Card */}
        <section className="card" style={{ gridColumn: 'span 8' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span className="material-symbols-outlined">clinical_notes</span>
            Ficha del Paciente
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', marginBottom: '4px' }}>Fecha de Nacimiento</p>
              <p style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>
                {patient.dob ? `${formatDate(patient.dob).split(' a las')[0]} (${calculateAge(patient.dob)} años)` : 'No especificada'}
              </p>
            </div>
            <div>
              <p style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', marginBottom: '4px' }}>Hospital de Derivación</p>
              <p style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>{getHospitalName(patient.hospitalId)}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', marginBottom: '4px' }}>Dirección de Residencia</p>
              <p style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>{patient.address}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', marginBottom: '4px' }}>Diagnóstico Principal</p>
              <p style={{ color: 'var(--color-on-surface)', lineHeight: '1.6' }}>{patient.diagnosis}</p>
            </div>
          </div>
        </section>

        {/* Caregiver Detail Card */}
        <section className="card" style={{ gridColumn: 'span 4', backgroundColor: 'var(--color-surface-container-low)' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span className="material-symbols-outlined">hail</span>
            Cuidador Principal
          </h2>

          {caregiver ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--color-secondary-fixed)', 
                  color: 'var(--color-on-secondary-fixed-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined">person_4</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{caregiver.name}</p>
                  <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Vínculo: {caregiver.relation}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                    <span style={{ fontSize: '14px' }}>{caregiver.phone}</span>
                  </div>
                  <button className="icon-btn" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }} aria-label="Llamar">
                    <span className="material-symbols-outlined">phone</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(75, 100, 80, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', fontSize: '20px' }}>home</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-on-secondary-container)' }}>
                    ¿Vive con el paciente?: <strong>{caregiver.livesWithPatient ? 'Sí' : 'No'}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>psychology</span>
                    <span style={{ fontSize: '13px' }}>Nivel de Sobrecarga</span>
                  </div>
                  <span className={`chip ${caregiver.burdenLevel === 'Alto' ? 'chip-error' : caregiver.burdenLevel === 'Moderado' ? 'chip-warning' : 'chip-success'}`} style={{ fontSize: '11px' }}>
                    {caregiver.burdenLevel}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-outline)', fontStyle: 'italic' }}>No se registraron datos del cuidador.</p>
          )}
        </section>

        {/* History Chronological Timeline Section */}
        <section style={{ gridColumn: 'span 12', marginTop: '16px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--color-on-background)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingLeft: '8px' }}>
            <span className="material-symbols-outlined text-primary">history</span>
            Historial de Seguimientos
          </h2>

          {followUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>history_toggle_off</span>
              <p style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)' }}>Aún no se han registrado seguimientos para este paciente.</p>
            </div>
          ) : (
            <div className="timeline">
              {followUps.map(event => {
                const isAlert = event.alertActivated;
                return (
                  <div key={event.id} className="timeline-item">
                    {/* Circle Node */}
                    <div className={`timeline-marker ${isAlert ? 'timeline-marker-alert' : ''}`}>
                      {isAlert && <span className="material-symbols-outlined">priority_high</span>}
                    </div>
                    
                    {/* Content Box */}
                    <div className="timeline-content" style={{ borderLeftWidth: isAlert ? '4px' : '1px', borderLeftColor: isAlert ? 'var(--color-error)' : 'var(--color-outline-variant)' }}>
                      <div className="timeline-header">
                        <div className="timeline-title">
                          <span style={{ color: isAlert ? 'var(--color-error)' : 'var(--color-on-background)' }}>
                            {event.contactType === 'Presencial' ? 'Visita Domiciliaria' : 'Llamado Telefónico'} 
                            {isAlert ? ' - Crisis / Urgencia' : ' - Seguimiento'}
                          </span>
                          <span className={`chip ${isAlert ? 'chip-error' : event.contactType === 'Presencial' ? 'chip-success' : 'chip-info'}`} style={{ fontSize: '11px' }}>
                            {isAlert ? 'Urgente' : event.contactType}
                          </span>
                        </div>
                        <span className="timeline-meta">{formatDate(event.date)}</span>
                      </div>

                      {/* Symptoms Summary */}
                      {event.symptoms && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px', padding: '10px 14px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
                          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>bolt</span>
                            Dolor: <strong>{event.symptoms.pain || 'No registrado'}</strong>
                          </span>
                          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>sick</span>
                            Náuseas: <strong>{event.symptoms.nausea || 'No registrado'}</strong>
                          </span>
                          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>air</span>
                            Disnea: <strong>{event.symptoms.dyspnea || 'No registrado'}</strong>
                          </span>
                        </div>
                      )}

                      <p style={{ color: 'var(--color-on-surface)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {event.symptomObservations}
                      </p>

                      {event.interventions && (
                        <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                          <strong>Intervenciones:</strong> {event.interventions}
                        </div>
                      )}

                      {event.equipmentNeeds && event.equipmentNeeds.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong>Equipamiento solicitado:</strong>
                          {event.equipmentNeeds.map(eq => (
                            <span key={eq} className="chip chip-info" style={{ fontSize: '11px', padding: '2px 8px' }}>{eq}</span>
                          ))}
                        </div>
                      )}

                      <div className="timeline-author">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>volunteer_activism</span>
                        <span>Registrado por: <strong>{event.authorName}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <button 
        className="fab" 
        onClick={onNewFollowUp}
        aria-label="Registrar Seguimiento"
      >
        <span className="material-symbols-outlined">add</span>
        <span>Registrar Seguimiento</span>
      </button>

      {/* Alert Activation Modal */}
      <AlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
        patient={patient} 
        onSubmit={handleAlertSubmit} 
      />

      {/* PDF Summary Print Preview */}
      <PrintReportPreview
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        patient={patient}
        caregiver={caregiver}
        followUps={followUps}
        getHospitalName={getHospitalName}
      />
    </div>
  );
}
