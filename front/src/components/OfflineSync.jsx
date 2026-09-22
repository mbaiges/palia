import React, { useCallback, useEffect, useState } from 'react';
import { dbService } from '../services/container';
import { scrollToSection } from '../utils/navigation';

export default function OfflineSync({ focusSection, onFocusConsumed }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const loadQueue = useCallback(async () => {
    const queue = await dbService.getOfflineQueue().catch(() => []);
    setPendingItems(queue.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }, []);

  useEffect(() => {
    const online = () => { setIsOnline(true); dbService.syncOffline().then((result) => setMessage(result.synced ? `${result.synced} seguimiento${result.synced === 1 ? '' : 's'} sincronizado${result.synced === 1 ? '' : 's'}.` : '')).catch(() => undefined); };
    const offline = () => setIsOnline(false);
    const updated = () => loadQueue();
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('medice:data-updated', updated);
    loadQueue();
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('medice:data-updated', updated); };
  }, [loadQueue]);

  useEffect(() => {
    if (!focusSection) return;
    scrollToSection(focusSection === 'sync-network-log' ? 'sync-pending-items' : focusSection === 'sync-conflicts' ? 'sync-pending-items' : focusSection);
    onFocusConsumed?.();
  }, [focusSection, onFocusConsumed]);

  const sync = async () => {
    setIsSyncing(true); setMessage('');
    try {
      const result = await dbService.syncOffline();
      setMessage(result.synced ? `${result.synced} seguimiento${result.synced === 1 ? '' : 's'} sincronizado${result.synced === 1 ? '' : 's'}.` : result.pending ? 'Quedan seguimientos pendientes. Se conservaron en este dispositivo.' : 'No hay seguimientos pendientes.');
    } catch (error) { setMessage(`No se pudo sincronizar. Los datos siguen guardados en este dispositivo. ${error.message}`); }
    finally { setIsSyncing(false); await loadQueue(); }
  };

  return <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-gutter)' }}>
    <header className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #006781 100%)', color: 'white' }}>
      <p style={{ marginTop: 0 }}>Estado de red: <strong>{isOnline ? 'Con conexión' : 'Sin conexión'}</strong></p>
      <h2 style={{ margin: '8px 0' }}>Seguimientos pendientes</h2>
      <p>Los seguimientos sin conexión quedan en una cola local asociada a tu cuenta. Se sincronizan al recuperar conexión y confirmar tu sesión.</p>
      <button className="btn btn-secondary" type="button" onClick={sync} disabled={!isOnline || isSyncing || pendingItems.length === 0}>{isSyncing ? 'Sincronizando…' : 'Sincronizar ahora'}</button>
    </header>
    {message && <p role="status" className="card">{message}</p>}
    <div id="sync-pending-items" className="card">
      <h3 style={{ marginTop: 0 }}>Cola local ({pendingItems.length})</h3>
      {!pendingItems.length ? <p>No hay seguimientos guardados pendientes de sincronización.</p> : pendingItems.map((item) => {
        const patient = dbService.getPatient(item.patientId);
        const needsReview = item.status === 'needs-review';
        return <article key={item.id} style={{ borderTop: '1px solid var(--color-outline-variant)', padding: '16px 0' }}>
          <strong>{patient?.name || 'Ficha asignada'}</strong>
          <p style={{ margin: '4px 0' }}>{new Date(item.createdAt).toLocaleString('es-AR')} · {item.payload.durationMinutes} min · {needsReview ? 'Necesita revisión' : 'Pendiente de envío'}</p>
          {item.lastError && <p role="alert">{item.lastError}</p>}
          <button className="btn btn-tertiary" type="button" onClick={sync} disabled={!isOnline || isSyncing}>{needsReview ? 'Reintentar después de revisar' : 'Reintentar sincronización'}</button>
        </article>;
      })}
    </div>
  </section>;
}
