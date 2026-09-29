
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService, inviteService } from '../services/api';

// NOTE: invite validation intentionally uses the shared axios instance in
// services/api.ts so local dev (localhost:5001) and production stay in sync.

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  countryCode: '+91',
  gender: 'male',
  house: 'Kadannamanna',
  generation: '1',
  address: '',
  profession: '',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    background: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    border: '1px solid #E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
    background: '#F5F5F5',
    boxSizing: 'border-box',
  },
  button: {
    background: '#000',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
    border: 'none',
    width: '100%',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#000',
    marginTop: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #E0E0E0',
    alignItems: 'center',
    background: '#F5F5F5',
    cursor: 'pointer',
    textAlign: 'center',
  },
  radioButtonSelected: {
    background: '#000',
    border: '1px solid #000',
    color: '#fff',
  },
  houseGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  houseButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #E0E0E0',
    alignItems: 'center',
    background: '#F5F5F5',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: 8,
  },
  houseButtonSelected: {
    background: '#000',
    border: '1px solid #000',
    color: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    resize: 'vertical',
  },
  errorContainer: {
    background: '#FEE',
    border: '1px solid #FCC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#C00',
    fontSize: 14,
  },
  linkButton: {
    marginTop: 16,
    textAlign: 'center',
    color: '#000',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

const RegisterScreen: React.FC = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviterName, setInviterName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Validate invite token on mount
  useEffect(() => {
    const token = searchParams.get('invite');
    if (!token) {
      setError('Invalid or missing invite link. Registration requires an invitation from an existing member.');
      setInviteValid(false);
      return;
    }

    setInviteToken(token);
    
    // Validate the invite token
    inviteService.validateInvite(token)
      .then(response => {
        if (response.data.valid) {
          setInviteValid(true);
          setInviterName(response.data.createdByName);
          setFamilyName(response.data.familyName || 'Family directory');
          if (response.data.email) {
            setInvitedEmail(response.data.email);
            setForm((current) => ({ ...current, email: response.data.email }));
          }
          setError('');
        } else {
          setInviteValid(false);
          setError(response.data.message || 'Invalid invite token');
        }
      })
      .catch(err => {
        setInviteValid(false);
        setError(err?.response?.data?.message || 'Failed to validate invite token');
      });
  }, [searchParams]);

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const validateForm = () => {
    if (!form.firstName || !form.lastName) {
      setError('First and last name are required');
      return false;
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please provide a valid email address');
      return false;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!form.phone || form.phone.length < 10) {
      setError('Valid phone number is required');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inviteValid) {
      setError('Invalid invite token. Please use a valid invitation link.');
      return;
    }
    
    if (!validateForm()) return;

    if (!reviewing) {
      setReviewing(true);
      return;
    }
    
    setLoading(true);
    try {
      const registrationData = {
        firstName: form.firstName,
        lastName: form.lastName,
        ...(form.email && { email: form.email }),
        password: form.password,
        phone: form.phone,
        countryCode: form.countryCode,
        gender: form.gender,
        house: form.house,
        generation: parseInt(form.generation) || 1,
        address: form.address,
        occupation: form.profession,
        role: 'user',
        inviteToken: inviteToken, // Include the invite token
      };
      const response = await authService.register(registrationData);
      setSubmitted(response.status === 'Pending');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.content} onSubmit={handleRegister}>
        <div style={styles.title}>Create Account</div>
        <div style={styles.subtitle}>
          {inviteValid ? `Invited by ${inviterName}` : 'Join the Vakshesa Family'}
        </div>
        {error && (
          <div style={styles.errorContainer}><span style={styles.errorText}>{error}</span></div>
        )}
        
        {inviteValid === false && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              style={{
                ...styles.button,
                background: '#666',
                marginTop: 0,
              }}
              onClick={() => navigate('/')}
            >
              Return to Login
            </button>
          </div>
        )}
        
        {submitted && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request submitted</h2>
            <p style={{ color: '#555', lineHeight: 1.5 }}>Your registration for {familyName} is <strong>Pending Approval</strong>. An admin must approve it before you can access the directory. Sign in later to check your request status.</p>
            <button type="button" style={styles.button} onClick={() => navigate('/', { replace: true })}>Go to Sign In</button>
          </div>
        )}

        {inviteValid && !submitted && (
          <>
          {reviewing ? (
            <div>
              <div style={styles.sectionTitle}>Review your request</div>
              <p style={{ color: '#555', marginBottom: 16 }}>You are requesting access to <strong>{familyName}</strong>. Review the information below before sending it to an admin.</p>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div><dt style={{ color: '#777' }}>Name</dt><dd>{form.firstName} {form.lastName}</dd></div>
                <div><dt style={{ color: '#777' }}>Email</dt><dd>{form.email || 'Not provided'}</dd></div>
                <div><dt style={{ color: '#777' }}>Phone</dt><dd>{form.countryCode} {form.phone}</dd></div>
                <div><dt style={{ color: '#777' }}>House</dt><dd>{form.house}</dd></div>
                <div><dt style={{ color: '#777' }}>Gender</dt><dd>{form.gender}</dd></div>
                <div><dt style={{ color: '#777' }}>Occupation</dt><dd>{form.profession || 'Not provided'}</dd></div>
                <div style={{ gridColumn: '1 / -1' }}><dt style={{ color: '#777' }}>Address</dt><dd>{form.address || 'Not provided'}</dd></div>
              </dl>
              <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>Your password is set and will not be shown to the reviewing admin.</p>
              <button type="button" style={{ ...styles.button, background: '#666', marginTop: 12 }} onClick={() => setReviewing(false)} disabled={loading}>Back to edit</button>
              <button style={{ ...styles.button, marginTop: 10, ...(loading ? styles.buttonDisabled : {}) }} type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Request access'}
              </button>
            </div>
          ) : <>
            <div style={styles.sectionTitle}>Personal Information</div>
        <input style={styles.input} placeholder="First Name *" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} disabled={loading} />
        <input style={styles.input} placeholder="Last Name *" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} disabled={loading} />
        <input style={styles.input} placeholder="Email (optional)" value={form.email} onChange={e => handleChange('email', e.target.value)} disabled={loading || !!invitedEmail} type="email" />
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select 
            style={{ ...styles.input, marginBottom: 0, width: '35%' }} 
            value={form.countryCode} 
            onChange={e => handleChange('countryCode', e.target.value)} 
            disabled={loading}
          >
            <option value="+91">🇮🇳 +91 India</option>
            <option value="+971">🇦🇪 +971 UAE</option>
            <option value="+966">🇸🇦 +966 Saudi Arabia</option>
            <option value="+965">🇰🇼 +965 Kuwait</option>
            <option value="+974">🇶🇦 +974 Qatar</option>
            <option value="+968">🇴🇲 +968 Oman</option>
            <option value="+973">🇧🇭 +973 Bahrain</option>
            <option value="+1">🇺🇸 +1 USA/Canada</option>
            <option value="+44">🇬🇧 +44 UK</option>
            <option value="+61">🇦🇺 +61 Australia</option>
            <option value="+64">🇳🇿 +64 New Zealand</option>
            <option value="+65">🇸🇬 +65 Singapore</option>
            <option value="+60">🇲🇾 +60 Malaysia</option>
            <option value="+66">🇹🇭 +66 Thailand</option>
            <option value="+63">🇵🇭 +63 Philippines</option>
            <option value="+62">🇮🇩 +62 Indonesia</option>
            <option value="+84">🇻🇳 +84 Vietnam</option>
            <option value="+86">🇨🇳 +86 China</option>
            <option value="+81">🇯🇵 +81 Japan</option>
            <option value="+82">🇰🇷 +82 South Korea</option>
            <option value="+92">🇵🇰 +92 Pakistan</option>
            <option value="+880">🇧🇩 +880 Bangladesh</option>
            <option value="+94">🇱🇰 +94 Sri Lanka</option>
            <option value="+977">🇳🇵 +977 Nepal</option>
            <option value="+20">🇪🇬 +20 Egypt</option>
            <option value="+27">🇿🇦 +27 South Africa</option>
            <option value="+49">🇩🇪 +49 Germany</option>
            <option value="+33">🇫🇷 +33 France</option>
            <option value="+39">🇮🇹 +39 Italy</option>
            <option value="+34">🇪🇸 +34 Spain</option>
            <option value="+31">🇳🇱 +31 Netherlands</option>
            <option value="+32">🇧🇪 +32 Belgium</option>
            <option value="+41">🇨🇭 +41 Switzerland</option>
            <option value="+43">🇦🇹 +43 Austria</option>
            <option value="+46">🇸🇪 +46 Sweden</option>
            <option value="+47">🇳🇴 +47 Norway</option>
            <option value="+45">🇩🇰 +45 Denmark</option>
            <option value="+358">🇫🇮 +358 Finland</option>
            <option value="+353">🇮🇪 +353 Ireland</option>
            <option value="+351">🇵🇹 +351 Portugal</option>
            <option value="+30">🇬🇷 +30 Greece</option>
            <option value="+48">🇵🇱 +48 Poland</option>
            <option value="+7">🇷🇺 +7 Russia</option>
            <option value="+90">🇹🇷 +90 Turkey</option>
            <option value="+972">🇮🇱 +972 Israel</option>
            <option value="+961">🇱🇧 +961 Lebanon</option>
            <option value="+962">🇯🇴 +962 Jordan</option>
            <option value="+55">🇧🇷 +55 Brazil</option>
            <option value="+52">🇲🇽 +52 Mexico</option>
            <option value="+54">🇦🇷 +54 Argentina</option>
          </select>
          <input 
            style={{ ...styles.input, marginBottom: 0, flex: 1 }} 
            placeholder="Phone Number *" 
            value={form.phone} 
            onChange={e => handleChange('phone', e.target.value)} 
            disabled={loading} 
            type="tel" 
          />
        </div>
        <div style={styles.label}>Gender *</div>
        <div style={styles.radioGroup}>
          <div style={{ ...styles.radioButton, ...(form.gender === 'male' ? styles.radioButtonSelected : {}) }} onClick={() => !loading && handleChange('gender', 'male')}>
            <span style={{ color: form.gender === 'male' ? '#fff' : '#666' }}>Male</span>
          </div>
          <div style={{ ...styles.radioButton, ...(form.gender === 'female' ? styles.radioButtonSelected : {}) }} onClick={() => !loading && handleChange('gender', 'female')}>
            <span style={{ color: form.gender === 'female' ? '#fff' : '#666' }}>Female</span>
          </div>
        </div>
        <div style={styles.label}>House *</div>
        <div style={styles.houseGrid}>
          {['Kadannamanna', 'Mankada', 'Ayiranazhi', 'Aripra'].map((house, idx) => (
            <div
              key={house}
              style={{
                ...styles.houseButton,
                ...(form.house === house ? styles.houseButtonSelected : {}),
                width: '48%',
                marginRight: idx % 2 === 0 ? '4%' : '0',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
              onClick={() => !loading && handleChange('house', house)}
            >
              <span style={{ color: form.house === house ? '#fff' : '#666' }}>{house}</span>
            </div>
          ))}
        </div>
        {/* <input style={styles.input} placeholder="Generation (e.g., 1, 2, 3)" value={form.generation} onChange={e => handleChange('generation', e.target.value)} disabled={loading} type="number" /> */}
        <textarea style={{ ...styles.input, ...styles.textArea }} placeholder="Address" value={form.address} onChange={e => handleChange('address', e.target.value)} disabled={loading} />
        <input style={styles.input} placeholder="Profession" value={form.profession} onChange={e => handleChange('profession', e.target.value)} disabled={loading} />
        <div style={styles.sectionTitle}>Security</div>
        <input style={styles.input} placeholder="Password (min 8 characters) *" value={form.password} onChange={e => handleChange('password', e.target.value)} disabled={loading} type="password" />
        <input style={styles.input} placeholder="Confirm Password *" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} disabled={loading} type="password" />
        <button style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }} type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Request access to Vakshesa Directory'}
        </button>
        <div style={styles.linkButton} onClick={() => navigate('/')}>Already have an account? Sign In</div>
          </>}
          </>
        )}
      </form>
    </div>
  );
};

export default RegisterScreen;
