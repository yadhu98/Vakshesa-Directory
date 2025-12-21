
import React, { useState } from 'react';
import { authService } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#667eea',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    background: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
      input: {
        width: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
        color: '#333',
        outline: 'none',
        boxSizing: 'border-box',
      },
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    background: '#667eea',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    border: 'none',
    width: '100%',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
      register: {
        marginTop: 16,
        textAlign: 'center',
        color: '#667eea',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: 15,
      },
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorContainer: {
    background: '#fee',
    border: '1px solid #fcc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  register: {
    marginTop: 16,
    textAlign: 'center',
    color: '#667eea',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 15,
  },
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

    const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.login(email, password);
        onLoginSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container as React.CSSProperties}>
      <div style={styles.content as React.CSSProperties}>
        <div style={styles.title as React.CSSProperties}>Vksha Event</div>
        <div style={styles.subtitle as React.CSSProperties}>Family Festival Management</div>
        {error && (
          <div style={styles.errorContainer as React.CSSProperties}>
            <span style={styles.errorText as React.CSSProperties}>{error}</span>
          </div>
        )}
        <input
          style={styles.input as React.CSSProperties}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          style={styles.input as React.CSSProperties}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        <button
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) } as React.CSSProperties}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div
          style={styles.register as React.CSSProperties}
          onClick={() => window.location.replace('/register')}
        >
          New here? Register
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
