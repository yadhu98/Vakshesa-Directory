
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

// Shared theme colors
const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
    medium: '#999999',
    dark: '#666666',
  },
};

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingIntro, setPlayingIntro] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingCredentials = useRef<{ email: string; password: string } | null>(null);
  const loginInProgress = useRef(false);

  const completeLogin = async () => {
    const credentials = pendingCredentials.current;
    if (!credentials || loginInProgress.current) return;
    loginInProgress.current = true;
    pendingCredentials.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
    setError('');
    setLoading(true);
    setPlayingIntro(false);
    try {
      await authService.login(credentials.email, credentials.password);
      navigate('/directory', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
      loginInProgress.current = false;
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || playingIntro || pendingCredentials.current || loginInProgress.current) return;
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    pendingCredentials.current = { email, password };
    setPlayingIntro(true);
    const video = videoRef.current;
    if (!video) {
      void completeLogin();
      return;
    }

    video.currentTime = 0;
    video.play().catch(() => { void completeLogin(); });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header with Logo */}
        <div style={styles.header}>
          <h1 style={styles.title}>Vakshesa Family Directory</h1>
          
          {/* Logo Container */}
          <div style={styles.logoContainer}>
            <video
              ref={videoRef}
              src="/vakshesa-login-intro.mp4"
              poster="/vakshesa-login-crest.png"
              aria-label="Vakshesa family crest animation"
              playsInline
              preload="metadata"
              onEnded={() => { void completeLogin(); }}
              onError={() => { if (playingIntro) void completeLogin(); }}
              style={styles.logoImage}
            />
          </div>
          
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} style={styles.form}>
          {error && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <input
            type="text"
            placeholder="Email or Phone Number"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={loading || playingIntro}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading || playingIntro}
          />

          <button
            type="submit"
            style={{
              ...styles.primaryButton,
              ...(loading || playingIntro ? styles.buttonDisabled : {}),
            }}
            disabled={loading || playingIntro}
          >
            {loading ? 'Loading...' : playingIntro ? 'Playing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray.light,
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '48px 32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '16px',
  },
  logoContainer: {
    width: 'clamp(250px, 78vw, 340px)',
    height: 'clamp(250px, 78vw, 340px)',
    backgroundColor: 'transparent',
    borderRadius: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 8px',
    padding: 0,
    border: 0,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: 'scale(1.3)',
  },
  logoPlaceholder: {
    fontSize: '20px',
    fontWeight: '600',
    color: colors.gray.dark,
  },
  form: {
    marginTop: '8px',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '14px',
    margin: 0,
  },
  input: {
    width: '100%',
    backgroundColor: colors.gray.light,
    border: `1px solid ${colors.gray.border}`,
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '16px',
    color: colors.primary,
    marginBottom: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '12px',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  registerLinkContainer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  registerText: {
    fontSize: '14px',
    color: colors.gray.dark,
  },
  registerLink: {
    fontSize: '14px',
    color: colors.primary,
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default LoginScreen;
