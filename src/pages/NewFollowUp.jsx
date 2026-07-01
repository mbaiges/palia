import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function NewFollowUp({ patientId, onCancel, onSaveSuccess }) {
  const patient = dbService.getPatient(patientId);

  const [alertActivated, setAlertActivated] = useState(false);
  const [contactType, setContactType] = useState('Presencial');

  // Symptom dropdowns (matching mock: Dolor scale 0-10, Náuseas state, Disnea grade)
  const [dolorLevel, setDolorLevel] = useState('');
  const [nauseaLevel, setNauseaLevel] = useState('');
  const [disnea, setDisnea] = useState('');
  const [symptomObs, setSymptomObs] = useState('');

  // Social Risk
  const [familySupport, setFamilySupport] = useState('Sólido y constante');
  const [environmentNotes, setEnvironmentNotes] = useState('');

  // Equipment checkboxes (matching mock exactly)
  const [equip, setEquip] = useState({
    oxigeno: false,
    cama: false,
    colchon: false,
    aspirador: false,
  });
  const [equipOther, setEquipOther] = useState('');

  // Interventions
  const [interventions, setInterventions] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!patient) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>error</span>
        <h2 style={{ marginTop: '16px' }}>Paciente no encontrado</h2>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={onCancel}>Volver</button>
      </div>
    );
  }

  const toggleEquip = (key) => setEquip(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptomObs.trim() || !interventions.trim()) {
      setErrorMsg('Por favor complete todos los campos obligatorios marcados con *.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);

    const followUpData = {
      patientId,
      authorId: 'vol_1',
      authorName: 'Admin Palia',
      contactType,
      symptoms: { dolor: dolorLevel, nauseas: nauseaLevel, disnea },
      symptomObs,
      socialRisk: { familySupport, environmentNotes },
      equipment: Object.entries(equip).filter(([, v]) => v).map(([k]) => k),
      equipOther: equipOther.trim(),
      interventions,
      alertActivated,
    };

    setTimeout(() => {
      try {
        dbService.saveFollowUp(followUpData);
        onSaveSuccess();
      } catch (err) {
        setErrorMsg('Error al guardar: ' + err.message);
        setIsSaving(false);
      }
    }, 800);
  };

  // Reusable checkbox card for equipment
  const EquipCard = ({ id, label }) => (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        border: `1.5px solid ${equip[id] ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
        borderRadius: 'var(--radius-lg)',
        backgroundColor: equip[id] ? 'var(--color-primary-container)' : 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={equip[id]}
        onChange={() => toggleEquip(id)}
        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', flexShrink: 0 }}
      />
      <span style={{
        fontSize: '14px',
        fontWeight: equip[id] ? 600 : 400,
        color: equip[id] ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)',
      }}>
        {label}
      </span>
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-stack-lg)' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-outline)', marginBottom: '8px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--color-primary)' }} onClick={onCancel}>Ficha del Paciente</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <span>Nuevo Seguimiento</span>
          </nav>
          <h1 style={{ color: 'var(--color-on-background)' }}>Registro Clínico de Seguimiento</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
            Ingrese los detalles del acompañamiento actual. Priorice la claridad y los indicadores de bienestar del paciente.
          </p>
        </div>

        {/* Alert toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          backgroundColor: alertActivated ? 'var(--color-error-container)' : 'var(--color-surface-container-lowest)',
          padding: '14px 20px', borderRadius: 'var(--radius-lg)',
          border: `1.5px solid ${alertActivated ? 'var(--color-error)' : 'var(--color-outline-variant)'}`,
          transition: 'all 0.2s ease',
        }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: alertActivated ? 'var(--color-error)' : 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado de Alerta</p>
            <p style={{ fontWeight: 700, fontSize: '15px', color: alertActivated ? 'var(--color-error)' : 'var(--color-on-surface)', marginTop: '2px' }}>
              {alertActivated ? 'ALERTA ACTIVADA' : 'Seguimiento Estándar'}
            </p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={alertActivated} onChange={(e) => setAlertActivated(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bento-grid">

        {/* ── Sintomatología Actual (8/12) ── */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ padding: '8px', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: 'var(--radius-md)' }}>bolt</span>
            <h2 style={{ fontSize: '20px', color: 'var(--color-on-surface)' }}>Sintomatología Actual</h2>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Tipo de Acompañamiento *</label>
              <select name="contactType" value={contactType} onChange={(e) => setContactType(e.target.value)}>
                <option value="Presencial">Presencial (Visita Domiciliaria)</option>
                <option value="Remoto">Remoto (Soporte Telefónico)</option>
              </select>
            </div>

            {/* 3-column symptom dropdowns matching mock */}
            <div className="form-group">
              <label>Evaluación de Síntomas</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>bolt</span>
                    Dolor (Escala 0-10)
                  </label>
                  <select name="dolorLevel" value={dolorLevel} onChange={(e) => setDolorLevel(e.target.value)}>
                    <option value="">Seleccionar nivel...</option>
                    <option value="0">0 – Ausente</option>
                    <option value="1-3">1-3 – Leve</option>
                    <option value="4-6">4-6 – Moderado</option>
                    <option value="7-9">7-9 – Severo</option>
                    <option value="10">10 – Insoportable</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>sick</span>
                    Náuseas / Malestar
                  </label>
                  <select name="nauseaLevel" value={nauseaLevel} onChange={(e) => setNauseaLevel(e.target.value)}>
                    <option value="">Seleccionar estado...</option>
                    <option value="Ninguno">Ninguno</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Frecuente">Frecuente</option>
                    <option value="Persistente">Persistente</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>wind_power</span>
                    Disnea (Dificultad Resp.)
                  </label>
                  <select name="disnea" value={disnea} onChange={(e) => setDisnea(e.target.value)}>
                    <option value="">Seleccionar grado...</option>
                    <option value="Grado 0 – Normal">Grado 0 – Normal</option>
                    <option value="Grado 1 – Leve">Grado 1 – Leve</option>
                    <option value="Grado 2 – Moderada">Grado 2 – Moderada</option>
                    <option value="Grado 3 – Severa">Grado 3 – Severa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones detalladas de síntomas *</label>
              <textarea
                placeholder="Describa el estado de ánimo, fatiga, nivel de conciencia o cualquier cambio notable en el estado físico del paciente..."
                value={symptomObs}
                onChange={(e) => setSymptomObs(e.target.value)}
                rows="4"
                required
              />
            </div>
          </div>
        </div>

        {/* ── Riesgo Social (4/12) ── */}
        <div className="card" style={{ gridColumn: 'span 4', backgroundColor: 'var(--color-secondary-container)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ padding: '8px', backgroundColor: 'var(--color-on-secondary-container)', color: 'white', borderRadius: 'var(--radius-md)' }}>clinical_notes</span>
            <h2 style={{ fontSize: '20px', color: 'var(--color-on-secondary-container)' }}>Riesgo Social</h2>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label style={{ color: 'var(--color-on-secondary-container)' }}>Apoyo Familiar *</label>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                {['Sólido y constante', 'Intermitente / Fragilidad', 'Ausente / Riesgo Crítico'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: familySupport === opt ? 700 : 400, color: 'var(--color-on-secondary-container)' }}>
                    <input
                      type="radio"
                      name="familySupport"
                      value={opt}
                      checked={familySupport === opt}
                      onChange={() => setFamilySupport(opt)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ color: 'var(--color-on-secondary-container)' }}>Notas de entorno</label>
              <textarea
                placeholder="Estado anímico del cuidador, higiene del hogar, apoyo vecinal..."
                value={environmentNotes}
                onChange={(e) => setEnvironmentNotes(e.target.value)}
                rows="4"
                style={{ backgroundColor: 'rgba(255,255,255,0.55)', border: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* ── Necesidades de Equipamiento (6/12) ── */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span className="material-symbols-outlined" style={{ padding: '8px', backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>medical_services</span>
            <h2 style={{ fontSize: '20px', color: 'var(--color-on-surface)' }}>Necesidades de Equipamiento</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <EquipCard id="oxigeno" label="Concentrador Oxígeno" />
            <EquipCard id="cama" label="Cama Articulada" />
            <EquipCard id="colchon" label="Colchón Antiescaras" />
            <EquipCard id="aspirador" label="Aspirador Secreciones" />
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <input
              type="text"
              placeholder="Otro equipamiento específico..."
              value={equipOther}
              onChange={(e) => setEquipOther(e.target.value)}
            />
          </div>
        </div>

        {/* ── Intervenciones Realizadas (6/12) ── */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span className="material-symbols-outlined" style={{ padding: '8px', backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>healing</span>
            <h2 style={{ fontSize: '20px', color: 'var(--color-on-surface)' }}>Intervenciones Realizadas *</h2>
          </div>
          <div className="form-group">
            <label>Resumen de la intervención</label>
            <textarea
              placeholder="Describa detalladamente las acciones tomadas durante esta sesión (ej: movilizaciones suave, administración de medicación indicada, contención emocional, diálogo espiritual...)"
              value={interventions}
              onChange={(e) => setInterventions(e.target.value)}
              rows="7"
              required
            />
          </div>
        </div>

        {/* ── Footer Actions (12/12) ── */}
        <div style={{
          gridColumn: 'span 12',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid var(--color-outline-variant)',
          paddingTop: '24px',
          marginTop: '8px',
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--color-outline)', marginRight: 'auto' }}>
            Último guardado automático: hace 2 minutos
          </p>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
            Cancelar y Salir
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ minWidth: '200px', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {isSaving ? 'sync' : 'save'}
            </span>
            {isSaving ? 'Guardando...' : 'Guardar Seguimiento'}
          </button>
        </div>

      </form>
    </div>
  );
}
