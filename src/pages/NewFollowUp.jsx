import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function NewFollowUp({ patientId, onCancel, onSaveSuccess }) {
  const patient = dbService.getPatient(patientId);

  // Form states
  const [alertActivated, setAlertActivated] = useState(false);
  const [contactType, setContactType] = useState('Presencial');
  
  // Symptoms
  const [pain, setPain] = useState('');
  const [nausea, setNausea] = useState('');
  const [dyspnea, setDyspnea] = useState('');
  const [symptomObservations, setSymptomObservations] = useState('');

  // Social Risk
  const [familySupport, setFamilySupport] = useState('Sólido y constante');
  const [environmentNotes, setEnvironmentNotes] = useState('');

  // Equipments
  const [equipments, setEquipments] = useState({
    oxygen: false,
    bed: false,
    mattress: false,
    aspirator: false
  });
  const [equipmentOther, setEquipmentOther] = useState('');

  // Interventions
  const [interventions, setInterventions] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!patient) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Paciente no encontrado</h2>
        <button className="btn btn-primary" onClick={onCancel}>Volver</button>
      </div>
    );
  }

  const handleCheckboxChange = (name) => {
    setEquipments(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pain || !nausea || !dyspnea || !symptomObservations || !interventions) {
      setErrorMsg('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    setIsSaving(true);

    // Build equipment array
    const equipmentNeeds = [];
    if (equipments.oxygen) equipmentNeeds.push('Concentrador Oxígeno');
    if (equipments.bed) equipmentNeeds.push('Cama Articulada');
    if (equipments.mattress) equipmentNeeds.push('Colchón Antiescaras');
    if (equipments.aspirator) equipmentNeeds.push('Aspirador Secreciones');
    if (equipmentOther.trim()) equipmentNeeds.push(equipmentOther.trim());

    const followUpData = {
      patientId,
      authorId: 'vol_1', // Marta Rodríguez default
      authorName: 'Marta Rodríguez',
      contactType,
      symptoms: {
        pain,
        nausea,
        dyspnea
      },
      symptomObservations,
      socialRisk: {
        familySupport,
        environmentNotes
      },
      equipmentNeeds,
      equipmentOther: equipmentOther.trim(),
      interventions,
      alertActivated
    };

    // Save report
    setTimeout(() => {
      try {
        dbService.saveFollowUp(followUpData);
        onSaveSuccess();
      } catch (err) {
        setErrorMsg('Error al guardar el reporte: ' + err.message);
        setIsSaving(false);
      }
    }, 1000); // Visual saving spinner simulation
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>
      {/* Header section with back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-outline)', marginBottom: '8px' }}>
            <span style={{ cursor: 'pointer' }} onClick={onCancel}>Ficha del Paciente</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', margin: '0 4px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Nuevo Seguimiento</span>
          </nav>
          <h1 style={{ color: 'var(--color-on-background)' }}>Registro Clínico de Seguimiento</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px', maxWidth: '640px' }}>
            Ingrese los detalles del acompañamiento actual. Priorice la claridad y los indicadores de bienestar del paciente.
          </p>
        </div>

        {/* Dynamic Alert Toggle Status Card */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          backgroundColor: 'var(--color-surface-container-lowest)', 
          padding: '12px 18px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
        }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Estado de Alerta</p>
            <p style={{ 
              fontWeight: 700, 
              color: alertActivated ? 'var(--color-error)' : 'var(--color-on-surface)',
              fontSize: '15px'
            }}>
              {alertActivated ? 'ALERTA ACTIVADA' : 'Seguimiento Estándar'}
            </p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={alertActivated}
              onChange={(e) => setAlertActivated(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Form Bento Layout */}
      <form onSubmit={handleSubmit} className="bento-grid">
        {/* Left Column: Symptoms */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px', borderRadius: 'var(--radius-md)' }}>bolt</span>
              <h2 style={{ fontSize: '20px' }}>Sintomatología Actual</h2>
            </div>

            <div className="form-section">
              {/* Type select */}
              <div className="form-group">
                <label>Tipo de Acompañamiento *</label>
                <select name="contactType" value={contactType} onChange={(e) => setContactType(e.target.value)}>
                  <option value="Presencial">Presencial (Visita Domiciliaria)</option>
                  <option value="Remoto">Remoto (Soporte Telefónico)</option>
                </select>
              </div>

              {/* Symptom Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Dolor (Escala 0-10) *</label>
                  <select name="pain" value={pain} onChange={(e) => setPain(e.target.value)} required>
                    <option value="">Seleccionar nivel...</option>
                    <option value="0 - Ausente">0 - Ausente</option>
                    <option value="1-3 - Leve">1-3 - Leve</option>
                    <option value="4-6 - Moderado">4-6 - Moderado</option>
                    <option value="7-9 - Severo">7-9 - Severo</option>
                    <option value="10 - Insoportable">10 - Insoportable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Náuseas / Malestar *</label>
                  <select name="nausea" value={nausea} onChange={(e) => setNausea(e.target.value)} required>
                    <option value="">Seleccionar nivel...</option>
                    <option value="Ninguno">Ninguno</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Frecuente">Frecuente</option>
                    <option value="Persistente">Persistente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Disnea (Resp.) *</label>
                  <select name="dyspnea" value={dyspnea} onChange={(e) => setDyspnea(e.target.value)} required>
                    <option value="">Seleccionar nivel...</option>
                    <option value="Grado 0 - Normal">Grado 0 - Normal</option>
                    <option value="Grado 1 - Leve">Grado 1 - Leve</option>
                    <option value="Grado 2 - Moderada">Grado 2 - Moderada</option>
                    <option value="Grado 3 - Severa">Grado 3 - Severa</option>
                  </select>
                </div>
              </div>

              {/* Observations details */}
              <div className="form-group">
                <label>Observaciones Detalladas de Síntomas *</label>
                <textarea
                  placeholder="Describa el estado de ánimo, fatiga, nivel de conciencia o cualquier cambio notable en el estado físico del paciente..."
                  value={symptomObservations}
                  onChange={(e) => setSymptomObservations(e.target.value)}
                  rows="4"
                  required
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Social Risk Card */}
        <div style={{ gridColumn: 'span 4' }}>
          <div className="card" style={{ height: '100%', backgroundColor: 'var(--color-secondary-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--color-on-secondary-container)' }}>
              <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-on-secondary-container)', color: 'white', padding: '8px', borderRadius: 'var(--radius-md)' }}>clinical_notes</span>
              <h2 style={{ fontSize: '20px' }}>Riesgo Social</h2>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label style={{ color: 'var(--color-on-secondary-container)' }}>Apoyo Familiar *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  {[
                    'Sólido y constante',
                    'Intermitente / Fragilidad',
                    'Ausente / Riesgo Crítico'
                  ].map(option => (
                    <label 
                      key={option} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '14px', 
                        color: 'var(--color-on-secondary-container)',
                        fontWeight: familySupport === option ? 700 : 500,
                        cursor: 'pointer' 
                      }}
                    >
                      <input
                        type="radio"
                        name="familySupport"
                        value={option}
                        checked={familySupport === option}
                        onChange={() => setFamilySupport(option)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label style={{ color: 'var(--color-on-secondary-container)' }}>Notas de Entorno</label>
                <textarea
                  placeholder="Estado anímico del cuidador, higiene del hogar, apoyo vecinal..."
                  value={environmentNotes}
                  onChange={(e) => setEnvironmentNotes(e.target.value)}
                  rows="4"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', border: 'none' }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Needs Section */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>medical_services</span>
            <h2 style={{ fontSize: '20px' }}>Necesidades de Equipamiento</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="form-group-checkbox">
              <input 
                type="checkbox" 
                checked={equipments.oxygen}
                onChange={() => handleCheckboxChange('oxygen')}
              />
              <span>Concentrador Oxígeno</span>
            </label>
            <label className="form-group-checkbox">
              <input 
                type="checkbox" 
                checked={equipments.bed}
                onChange={() => handleCheckboxChange('bed')}
              />
              <span>Cama Articulada</span>
            </label>
            <label className="form-group-checkbox">
              <input 
                type="checkbox" 
                checked={equipments.mattress}
                onChange={() => handleCheckboxChange('mattress')}
              />
              <span>Colchón Antiescaras</span>
            </label>
            <label className="form-group-checkbox">
              <input 
                type="checkbox" 
                checked={equipments.aspirator}
                onChange={() => handleCheckboxChange('aspirator')}
              />
              <span>Aspirador Secreciones</span>
            </label>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <input 
              type="text" 
              placeholder="Otro equipamiento específico solicitado..." 
              value={equipmentOther}
              onChange={(e) => setEquipmentOther(e.target.value)}
            />
          </div>
        </div>

        {/* Interventions Section */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined" style={{ backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>healing</span>
            <h2 style={{ fontSize: '20px' }}>Intervenciones Realizadas *</h2>
          </div>
          <div className="form-group">
            <textarea
              placeholder="Describa detalladamente las acciones tomadas durante esta sesión (ej: movilizaciones suave, administración de medicación indicada, contención emocional, diálogo espiritual...)"
              value={interventions}
              onChange={(e) => setInterventions(e.target.value)}
              rows="6"
              required
            ></textarea>
          </div>
        </div>

        {/* Actions Footer */}
        <div style={{ 
          gridColumn: 'span 12', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          gap: '24px', 
          borderTop: '1px solid var(--color-outline-variant)', 
          paddingTop: '24px',
          marginTop: '16px'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar y Salir
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSaving}
            style={{ minWidth: '180px' }}
          >
            <span className="material-symbols-outlined">
              {isSaving ? 'sync' : 'save'}
            </span>
            {isSaving ? 'Guardando...' : 'Guardar Seguimiento'}
          </button>
        </div>
      </form>
    </div>
  );
}
