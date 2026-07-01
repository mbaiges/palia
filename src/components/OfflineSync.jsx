import React, { useState, useEffect } from 'react';

export default function OfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Simulated offline edits pending sync
  const [pendingItems, setPendingItems] = useState([
    {
      id: 'item_1',
      name: 'Marta Rodríguez Pérez',
      time: 'Hoy, 09:45',
      type: 'Nota de visita (Dolor somático)',
      detail: 'Versión conflictiva detectada: Edición simultánea.',
      hasConflict: true
    },
    {
      id: 'item_2',
      name: 'Juan Antonio Gómez',
      time: 'Hoy, 10:12',
      type: 'Actualización de medicación',
      detail: '"Se ajusta dosis de fentanilo a 25mcg/h según protocolo..."',
      hasConflict: false
    },
    {
      id: 'item_3',
      name: 'Elena de la Rosa',
      time: 'Hoy, 11:30',
      type: 'Registro fotográfico de herida',
      detail: 'Archivo adjunto: lesion_sacro_v2.jpg (2.4MB)',
      hasConflict: false
    }
  ]);

  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleRetrySync = (id) => {
    if (!isOnline) {
      alert('Imposible sincronizar: Sin conexión a internet.');
      return;
    }
    setPendingItems(prev => prev.filter(item => item.id !== id));
    setSyncMessage('Elemento sincronizado con éxito.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const handleResolveConflict = (id) => {
    const keepCloud = confirm('¿Desea conservar la versión en la nube (Descartar local) o sobreescribir con la versión local?\n\nAceptar: Conservar Nube (Descartar local)\nCancelar: Sobreescribir Nube con Local');
    setPendingItems(prev => prev.filter(item => item.id !== id));
    setSyncMessage(keepCloud ? 'Conflicto resuelto: Versión local descartada.' : 'Conflicto resuelto: Versión local subida.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const handleSyncAll = () => {
    if (!isOnline) {
      alert('Imposible sincronizar: Sin conexión a internet.');
      return;
    }
    const conflicts = pendingItems.filter(item => item.hasConflict);
    if (conflicts.length > 0) {
      alert('Por favor resuelva los conflictos manuales primero.');
      return;
    }
    setPendingItems([]);
    setSyncMessage('Todos los elementos se sincronizaron con éxito.');
    setTimeout(() => setSyncMessage(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
      
      {/* Sync Status Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)',
          color: 'white',
          padding: '28px 32px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 90, 113, 0.15)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '80%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: isOnline ? '#34a853' : '#ea4335',
                boxShadow: `0 0 10px ${isOnline ? '#34a853' : '#ea4335'}`
              }} 
            />
            <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estado de Red: {isOnline ? 'Online - Conectado' : 'Offline - Trabajo Local'}
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Centro de Sincronización</h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Administre la base de datos relacional local PWA y resuelva conflictos de edición simultánea con el servidor principal.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSyncAll}
              disabled={pendingItems.length === 0}
              style={{ backgroundColor: 'white', color: 'var(--color-primary)', border: 'none', height: '40px', padding: '0 20px', fontWeight: 700, opacity: pendingItems.length === 0 ? 0.6 : 1 }}
            >
              Sincronizar Todo
            </button>
            <button className="btn btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', height: '40px', padding: '0 20px' }} onClick={() => alert('Mostrando logs de sincronización de red...')}>
              Ver Log de Red
            </button>
          </div>
        </div>

        <span className="material-symbols-outlined" style={{
          position: 'absolute',
          right: '-16px',
          top: '-16px',
          fontSize: '200px',
          opacity: 0.08,
          pointerEvents: 'none',
          transform: 'rotate(15deg)'
        }}>
          cloud_sync
        </span>
      </div>

      {syncMessage && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', borderRadius: 'var(--radius-md)', fontWeight: 600, animation: 'fadeIn 0.2s ease' }}>
          {syncMessage}
        </div>
      )}

      {/* Capacity & Elements Pending (Grid) */}
      <div className="bento-grid">
        
        {/* Capacity Storage Card */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary)' }}>sd_card</span>
              <span className="chip chip-info" style={{ fontSize: '11px' }}>Local Storage</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>Capacidad Local</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', marginTop: '4px', margin: 0 }}>
              {pendingItems.length} elemento{pendingItems.length !== 1 ? 's' : ''} pendiente{pendingItems.length !== 1 ? 's' : ''} por subir
            </p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '8px' }}>
              <span>Espacio utilizado</span>
              <strong>12%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '12%', height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
            </div>
            <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--color-outline)', marginTop: '12px', margin: 0 }}>
              Última limpieza automática: Hace 2 horas
            </p>
          </div>
        </div>

        {/* Pending Items List Card */}
        <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-container-low)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-on-surface)' }}>
              <span className="material-symbols-outlined">pending_actions</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Ediciones Pendientes de Subida</h3>
            </div>
            {pendingItems.filter(i => i.hasConflict).length > 0 && (
              <span className="chip chip-error" style={{ fontSize: '11px', fontWeight: 700 }}>
                {pendingItems.filter(i => i.hasConflict).length} Conflicto
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' }}>
            {pendingItems.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-secondary)', display: 'block', marginBottom: '12px' }}>cloud_done</span>
                <strong style={{ fontSize: '15px' }}>Todo Sincronizado</strong>
                <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>No hay observaciones pendientes ni conflictos en el buffer local.</p>
              </div>
            ) : (
              pendingItems.map(item => (
                <div 
                  key={item.id} 
                  style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid var(--color-outline-variant)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: item.hasConflict ? 'rgba(186,26,26,0.02)' : 'transparent',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, minWidth: '240px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: item.hasConflict ? 'var(--color-error-container)' : 'var(--color-surface-container-high)', 
                      color: item.hasConflict ? 'var(--color-error)' : 'var(--color-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined">{item.hasConflict ? 'warning' : 'edit_note'}</span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{item.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '2px', margin: 0 }}>{item.time} • {item.type}</p>
                      <p style={{ 
                        fontSize: '12px', 
                        color: item.hasConflict ? 'var(--color-error)' : 'var(--color-outline)', 
                        marginTop: '4px', 
                        margin: 0,
                        fontWeight: item.hasConflict ? 600 : 400 
                      }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <div>
                    {item.hasConflict ? (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleResolveConflict(item.id)}
                        style={{ backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: 'white', height: '36px', padding: '0 16px', fontSize: '12px', fontWeight: 700 }}
                      >
                        Resolver Conflicto
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleRetrySync(item.id)}
                        style={{ height: '36px', padding: '0 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>publish</span>
                        Reintentar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--color-outline-variant)', textAlign: 'center', backgroundColor: 'var(--color-surface-container-low)' }}>
            <button className="btn btn-tertiary" style={{ fontSize: '13px', fontWeight: 600 }} onClick={() => alert('Historial de sincronización completo:')}>
              Ver historial completo de sincronización
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
