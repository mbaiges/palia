import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/apiClient';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const devBypass = (import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') || (import.meta.env.MODE === 'e2e' && import.meta.env.VITE_E2E_AUTH_BYPASS === 'true');

  useEffect(() => {
    if (!googleClientId || window.google?.accounts?.oauth2) return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => script.remove();
  }, [googleClientId]);

  const completeLogin = async (result) => {
    const user = result?.data?.user;
    if (!user) throw new Error('La API no devolvió la identidad autenticada.');
    await onLoginSuccess({ ...user, displayName: user.name, photoURL: user.profileImageId, role: result.data.role });
  };

  const handleGoogleLogin = () => {
    setError('');
    if (!window.google?.accounts?.oauth2) {
      setError(googleClientId ? 'No se pudo cargar el inicio de sesión de Google. Revise su conexión.' : 'El inicio de sesión con Google aún no está configurado.');
      return;
    }
    setLoading(true);
    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
          try { await completeLogin(await api.auth.google(response.code)); }
          catch (err) { setError(err instanceof ApiError && err.status === 403 ? 'Tu cuenta no está autorizada para usar Palia.' : err.message); }
          finally { setLoading(false); }
        },
        error_callback: (response) => { setError(response.message || 'No se pudo completar la autenticación con Google.'); setLoading(false); },
      });
      client.requestCode();
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const handleDevLogin = async (email, name) => {
    setError(''); setLoading(true);
    try { await completeLogin(await api.auth.devBypass(email, name)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-surface-container-lowest)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px'
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 16px 48px rgba(0, 90, 113, 0.08)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-outline-variant)'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <img
            src="/logo_icon.png"
            alt="Palia"
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'contain',
            }}
          />
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.03em' }}>Palia</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px', fontWeight: 700 }}>
              Acompañamiento paliativo integral
            </p>
          </div>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)', margin: '0 0 8px 0' }}>Portal de Acompañamiento</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-outline)', lineHeight: '1.5', margin: 0 }}>
            Acceda de forma segura utilizando sus credenciales corporativas para gestionar la red de acompañamientos de Palia.
          </p>
        </div>

        {error && <div role="alert" style={{ marginBottom: '16px', padding: '12px', color: 'var(--color-error)', background: 'var(--color-error-container)', borderRadius: '12px' }}>{error}</div>}

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={handleGoogleLogin}
          disabled={loading || !googleClientId}
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: '0 8px 16px rgba(0, 90, 113, 0.1)'
          }}
        >
          {loading ? (
            <span className="material-symbols-outlined spin" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
          ) : (
            <svg style={{ width: '18px', height: '18px', fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.832 0-8.75-3.918-8.75-8.75s3.918-8.75 8.75-8.75c2.164 0 4.128.796 5.64 2.128l3.18-3.18C18.89 1.488 15.748 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.8 0 12.24-5.48 12.24-12.24 0-.825-.098-1.585-.245-2.22H12.24z"/>
            </svg>
          )}
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
        </button>
        {devBypass && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => handleDevLogin('admin@medice.test', 'Admin de prueba')}>Acceso de prueba admin</button>
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => handleDevLogin('volunteer@medice.test', 'Voluntario de prueba')}>Acceso de prueba voluntario</button>
          </div>
        )}

        {/* Footer Info */}
        <div style={{ 
          marginTop: '32px', 
          padding: '12px', 
          backgroundColor: 'var(--color-surface-container-low)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>
            cloud
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
            Datos compartidos desde la API segura
          </span>
        </div>
      </div>
    </div>
  );
}
