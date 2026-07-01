import React, { useState } from 'react';
import { dbService } from '../services/db';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const isCloud = dbService.isCloudBackend();

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulate Google Sign-In authentication delay
    setTimeout(() => {
      const mockUser = {
        uid: 'google_user_123',
        displayName: 'Marta Coordinadora',
        email: 'marta.coordinadora@palia.org',
        photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdXGuMCmzFL7Ymvch2Hc8CVe66MyxzA9MPk0_rnJQrR3mRNdxP3IygPbo2oFctVDuxLgYqjV1nUPmxIyaFISVXppyZKKtSrI8WU-4dBaWrUkpqkHUNbRjzCD82zHbf-2yO0-tEhgalTSGZcAyAg3KK5pKw9Wfhf8zqCOvzTPjZMFgqe2hVqS1kpsxH-8z-F_usFld3wvq4nRvmO2GzxGp6V8p3Vk8QAV61cC2nPLvwnKAGnq5i8Y6qxsS3r83q5wGpyQdCuU6XjQ8',
        role: 'Coordinador'
      };
      
      // Save auth state
      localStorage.setItem('palia_user', JSON.stringify(mockUser));
      setLoading(false);
      onLoginSuccess(mockUser);
    }, 1200);
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
            src="/logo.png" 
            alt="Palia Logo" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: 'var(--radius-xl)', 
              boxShadow: '0 8px 24px rgba(0, 90, 113, 0.15)' 
            }} 
          />
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.03em' }}>Palia</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px', fontWeight: 700 }}>
              Cuidados Paliativos Conectados
            </p>
          </div>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)', margin: '0 0 8px 0' }}>Portal del Coordinador</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-outline)', lineHeight: '1.5', margin: 0 }}>
            Acceda de forma segura utilizando sus credenciales corporativas para gestionar la red de acompañamientos de cuidados paliativos.
          </p>
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={handleGoogleLogin}
          disabled={loading}
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
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isCloud ? '#0070f3' : 'var(--color-secondary)' }}>
            {isCloud ? 'cloud' : 'database'}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
            Configurado en modo: <strong>{isCloud ? 'Firebase' : 'Persistencia Local'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
