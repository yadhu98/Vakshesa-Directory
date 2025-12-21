import React, { useState } from 'react';
import { api } from '../services/api';

const styles = {
  container: { background: '#fff', minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: 0 },
  section: { background: '#fff', margin: 16, padding: 20, borderRadius: 12, border: '1px solid #E0E0E0' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#000', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 500, color: '#666', marginBottom: 8, marginTop: 12 },
  input: { background: '#F5F5F5', border: '1px solid #E0E0E0', borderRadius: 8, padding: 12, fontSize: 16, color: '#000', width: '100%', marginBottom: 8 },
  button: { background: '#000', color: '#fff', width: '100%', padding: 16, borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 16, marginTop: 8, cursor: 'pointer', border: 'none' },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: { color: '#c00', marginBottom: 12 },
  success: { color: '#080', marginBottom: 12 },
};

const ChangePasswordScreen = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.section} onSubmit={handleChangePassword}>
        <div style={styles.sectionTitle}>Change Password</div>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}
        <div style={styles.label}>Current Password *</div>
        <input style={styles.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
        <div style={styles.label}>New Password *</div>
        <input style={styles.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 8 characters)" />
        <div style={styles.label}>Confirm New Password *</div>
        <input style={styles.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
        <button style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }} type="submit" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
      </form>
    </div>
  );
};

export default ChangePasswordScreen;
