import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function NewPatient({ onCancel, onSaveSuccess }) {
  const hospitals = dbService.getHospitals();

  // Form states
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  
  const [diagnosis, setDiagnosis] = useState('');
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');
  const [isComplex, setIsComplex] = useState(false);

  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [livesWithPatient, setLivesWithPatient] = useState(false);
  const [burdenLevel, setBurdenLevel] = useState('Bajo');

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !dni || !dob || !address || !diagnosis || !caregiverName || !caregiverPhone) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    const patientData = {
      name,
      dni,
      dob,
      address,
      diagnosis,
      hospitalId,
      currentStatus: isComplex ? 'Alerta' : 'Estable',
      assignedVolunteers: [] // Assigned in admin tab
    };

    const caregiverData = {
      name: caregiverName,
      relation: 'Familiar/Otro',
      phone: caregiverPhone,
      livesWithPatient,
      burdenLevel
    };

    try {
      const newPatientId = dbService.savePatient(patientData, caregiverData);
      onSaveSuccess(newPatientId);
    } catch (err) {
      setErrorMsg('Error al guardar el paciente: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Breadcrumb & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-outline)', marginBottom: '8px' }}>
            <span style={{ cursor: 'pointer' }} onClick={onCancel}>Pacientes</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', margin: '0 4px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Nuevo Registro</span>
          </nav>
          <h1 style={{ color: 'var(--color-on-background)' }}>Registrar Nuevo Paciente</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Complete los datos para iniciar el proceso de acompañamiento paliativo.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} type="button">
            <span className="material-symbols-outlined">save</span>
            Guardar Registro
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Bento Layout Form */}
      <form onSubmit={handleSubmit} className="bento-grid">
        {/* Left Column: Personal Data */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>person</span>
              <h2 style={{ fontSize: '20px' }}>Información Personal</h2>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: María García López"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Documento de Identidad (DNI) *</label>
                  <input
                    type="text"
                    placeholder="Ej: 32.144.555"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección de Residencia *</label>
                <textarea
                  placeholder="Calle, Número, Piso, Ciudad/Localidad (Argentina)..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Ingress Note (Supportive Info card) */}
          <div style={{ 
            backgroundColor: 'var(--color-surface-container-low)', 
            padding: '24px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px dashed var(--color-outline-variant)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ color: 'var(--color-primary)', fontSize: '16px', marginBottom: '8px' }}>Nota de Ingreso</h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', fontSize: '14px' }}>
                "El proceso de registro asegura que el voluntario asignado tenga toda la información necesaria para un acompañamiento digno, seguro y enfocado en la contención familiar."
              </p>
            </div>
            <span className="material-symbols-outlined" style={{ 
              position: 'absolute', 
              right: '-16px', 
              bottom: '-16px', 
              fontSize: '120px', 
              color: 'var(--color-primary)', 
              opacity: 0.04,
              transform: 'rotate(12deg)'
            }}>
              volunteer_activism
            </span>
          </div>
        </div>

        {/* Right Column: Clinical & Caregiver Info */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
          {/* Clinical Info */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-secondary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>medical_services</span>
              <h2 style={{ fontSize: '20px' }}>Información Clínica</h2>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label>Diagnóstico Principal *</label>
                <input
                  type="text"
                  placeholder="Ej: Neoplasia de pulmón estadio IV"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hospital de Referencia</label>
                <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Complex Situation Warning Box */}
              <div style={{ 
                backgroundColor: 'rgba(186, 26, 26, 0.05)', 
                border: '1px solid var(--color-error-container)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px',
                display: 'flex',
                gap: '12px',
                marginTop: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-error)', marginTop: '2px' }}>warning</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-error)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isComplex} 
                      onChange={(e) => setIsComplex(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-error)', cursor: 'pointer' }}
                    />
                    Situación Compleja
                  </label>
                  <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Marque esta opción si el paciente requiere atención de urgencia social o clínica inmediata.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Caregiver Details */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-tertiary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-on-tertiary-container)', color: 'var(--color-tertiary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>family_restroom</span>
              <h2 style={{ fontSize: '20px' }}>Cuidador Principal</h2>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label>Nombre del Cuidador *</label>
                <input
                  type="text"
                  placeholder="Ej: Elena Mendoza R."
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono de Contacto *</label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 5555 6666"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nivel de Sobrecarga del Cuidador</label>
                <select value={burdenLevel} onChange={(e) => setBurdenLevel(e.target.value)}>
                  <option value="Bajo">Bajo</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={livesWithPatient}
                  onChange={(e) => setLivesWithPatient(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                ¿Vive con el paciente?
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
