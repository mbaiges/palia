import React, { useState } from 'react';

export default function AlertModal({ isOpen, onClose, patient, onSubmit }) {
  const [alertLevel, setAlertLevel] = useState('Crisis Compleja'); // Default matches mock radio checked
  const [motive, setMotive] = useState('');
  const [observations, setObservations] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motive) {
      setErrorMsg('Por favor seleccione un motivo para la alerta.');
      return;
    }
    if (!observations.trim()) {
      setErrorMsg('Por favor ingrese observaciones clínicas.');
      return;
    }

    onSubmit({
      alertLevel,
      motive,
      observations: observations.trim()
    });
    
    // Clear inputs and close
    setMotive('');
    setObservations('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      boxSizing: 'border-box'
    }} onClick={onClose}>
      
      {/* Modal Container */}
      <div 
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          width: '100%',
          maxWidth: '600px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--color-on-background)' }}>Activar Alerta Clínica</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '2px 0 0 0' }}>Notificación inmediata al equipo médico de guardia</p>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {errorMsg && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {/* Patient Header preview */}
          <div style={{ backgroundColor: 'var(--color-surface-container-low)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-outline-variant)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-outline)', fontWeight: 700, textTransform: 'uppercase' }}>Paciente en alerta</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '2px' }}>
              {patient?.name} {patient?.dni ? `(${patient.dni})` : ''}
            </div>
          </div>

          {/* Alert Level Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Nivel de Alerta</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* Radio 1: Standard */}
              <label style={{
                border: alertLevel === 'Seguimiento Estándar' ? '2.5px solid var(--color-primary)' : '1.5px solid var(--color-outline-variant)',
                backgroundColor: alertLevel === 'Seguimiento Estándar' ? 'var(--color-on-primary-container)' : 'transparent',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}>
                <input 
                  type="radio" 
                  name="alertLevel" 
                  checked={alertLevel === 'Seguimiento Estándar'}
                  onChange={() => setAlertLevel('Seguimiento Estándar')}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>Seguimiento Estándar</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-outline)' }}>Atención prioritaria habitual</span>
                </div>
              </label>

              {/* Radio 2: Crisis */}
              <label style={{
                border: alertLevel === 'Crisis Compleja' ? '2.5px solid var(--color-error)' : '1.5px solid var(--color-outline-variant)',
                backgroundColor: alertLevel === 'Crisis Compleja' ? 'var(--color-error-container)' : 'transparent',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}>
                <input 
                  type="radio" 
                  name="alertLevel" 
                  checked={alertLevel === 'Crisis Compleja'}
                  onChange={() => setAlertLevel('Crisis Compleja')}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-error)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-error)' }}>Crisis Compleja</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-on-error-container)' }}>Intervención de emergencia</span>
                </div>
              </label>

            </div>
          </div>

          {/* Motive Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="modal-motive" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Motivo de la Alerta</label>
            <select 
              id="modal-motive"
              value={motive} 
              onChange={(e) => setMotive(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--color-outline-variant)',
                outline: 'none',
                backgroundColor: 'var(--color-surface-container-lowest)'
              }}
            >
              <option value="">Seleccione un motivo...</option>
              <option value="Dolor No Controlado">Dolor No Controlado</option>
              <option value="Disnea (Dificultad Respiratoria)">Disnea (Dificultad Respiratoria)</option>
              <option value="Insomnio Refractario">Insomnio Refractario</option>
              <option value="Crisis de Pánico / Agitación">Crisis de Pánico / Agitación</option>
              <option value="Otros (Especificar abajo)">Otros (Especificar abajo)</option>
            </select>
          </div>

          {/* Observations Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="modal-obs" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Observaciones Clínicas</label>
            <textarea
              id="modal-obs"
              placeholder="Describa la situación actual, constantes vitales relevantes y medicación de rescate..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--color-outline-variant)',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Disclaimer Info Panel */}
          <div style={{
            backgroundColor: 'var(--color-surface-container-low)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-outline-variant)',
            display: 'flex',
            gap: '12px'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>info</span>
            <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: '1.4' }}>
              <strong>Importante:</strong> Esta acción activará notificaciones push inmediatas al equipo médico. Por favor, asegúrese de que la información sea precisa.
            </p>
          </div>
        </form>

        {/* Modal Footer Buttons */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid var(--color-outline-variant)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: 'var(--color-surface-container-low)'
        }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ height: '40px', padding: '0 24px', fontSize: '14px' }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={handleSubmit}
            style={{ height: '40px', padding: '0 24px', fontSize: '14px', backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
            Activar Alerta
          </button>
        </div>
      </div>
    </div>
  );
}
