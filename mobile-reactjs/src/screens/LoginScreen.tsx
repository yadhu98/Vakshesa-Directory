
import React, { useState } from 'react';
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
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.login(email, password);
      navigate('/directory', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header with Logo */}
        <div style={styles.header}>
          <h1 style={styles.title}>Vakshesa Family Directory</h1>
          
          {/* Logo Container */}
          <div style={styles.logoContainer}>
            <img 
              src="/vakshesa-logo.png" 
              alt="Vakshesa Logo" 
              style={styles.logoImage}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="font-size: 20px; font-weight: 600; color: #666;">LOGO</span>';
                }
              }}
            />
          </div>
          
          <h2 style={styles.subtitle}>Welcome back</h2>
          <p style={styles.description}>
            Enter your email or phone number to sign in
          </p>
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
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />

          <button
            type="submit"
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Continue'}
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
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '24px',
  },
  logoContainer: {
    width: '150px',
    height: '150px',
    backgroundColor: colors.white,
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 24px',
    padding: '20px',
    border: `2px solid ${colors.gray.border}`,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  logoPlaceholder: {
    fontSize: '20px',
    fontWeight: '600',
    color: colors.gray.dark,
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: colors.gray.dark,
    lineHeight: '21px',
  },
  form: {
    marginTop: '24px',
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
