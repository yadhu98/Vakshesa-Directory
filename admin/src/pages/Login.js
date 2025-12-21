import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chrome, Apple } from 'lucide-react';
import api from '../services/api';
import { ButtonLoader } from '@components/Loader';
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
const LoginNew = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            // Store token
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
            // Set default auth header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Navigate based on role or super user flag
            if (user.role === 'admin' || user.isSuperUser) {
                navigate('/dashboard');
            }
            else {
                setError('Admin access required');
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleLogin = () => {
        setError('Google login not implemented yet');
    };
    const handleAppleLogin = () => {
        setError('Apple login not implemented yet');
    };
    return (_jsx("div", { style: styles.container, children: _jsxs("div", { style: styles.card, children: [_jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "Vakshesa Family Directory" }), _jsx("div", { style: styles.logoContainer, children: _jsx("span", { style: styles.logoPlaceholder, children: "LOGO" }) }), _jsx("h2", { style: styles.subtitle, children: "Welcome back" }), _jsx("p", { style: styles.description, children: "Enter your email to sign in to your account" })] }), _jsxs("form", { onSubmit: handleLogin, style: styles.form, children: [error && (_jsx("div", { style: styles.errorContainer, children: _jsx("p", { style: styles.errorText, children: error }) })), _jsx("input", { type: "email", placeholder: "email@domain.com", value: email, onChange: (e) => setEmail(e.target.value), style: styles.input, disabled: loading }), _jsx("input", { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), style: styles.input, disabled: loading }), _jsx("button", { type: "submit", style: {
                                ...styles.primaryButton,
                                ...(loading ? styles.buttonDisabled : {}),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }, disabled: loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(ButtonLoader, {}), _jsx("span", { children: "Loading..." })] })) : ('Continue') }), _jsxs("div", { style: styles.dividerContainer, children: [_jsx("div", { style: styles.divider }), _jsx("span", { style: styles.dividerText, children: "or" }), _jsx("div", { style: styles.divider })] }), _jsxs("button", { type: "button", onClick: handleGoogleLogin, style: styles.socialButton, disabled: loading, children: [_jsx(Chrome, { size: 18, style: { marginRight: '8px' } }), "Continue with Google"] }), _jsxs("button", { type: "button", onClick: handleAppleLogin, style: {
                                ...styles.socialButton,
                                ...styles.appleButton,
                            }, disabled: loading, children: [_jsx(Apple, { size: 18, style: { marginRight: '8px' } }), "Continue with Apple"] }), _jsx("div", { style: styles.switchContainer, children: _jsxs("p", { style: styles.switchText, children: ["Don't have an account?", ' ', _jsx("a", { href: "/register", style: styles.switchLink, children: "Sign up" })] }) })] }), _jsxs("p", { style: styles.termsText, children: ["By clicking continue, you agree to our", ' ', _jsx("a", { href: "#", style: styles.termsLink, children: "Terms of Service" }), ' ', "and", ' ', _jsx("a", { href: "#", style: styles.termsLink, children: "Privacy Policy" })] })] }) }));
};
const styles = {
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
        backgroundColor: colors.gray.light,
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto 24px',
        padding: '20px',
        border: `2px solid ${colors.gray.border}`,
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
    dividerContainer: {
        display: 'flex',
        alignItems: 'center',
        margin: '20px 0',
    },
    divider: {
        flex: 1,
        height: '1px',
        backgroundColor: colors.gray.border,
    },
    dividerText: {
        margin: '0 12px',
        fontSize: '14px',
        color: colors.gray.dark,
    },
    socialButton: {
        width: '100%',
        backgroundColor: colors.white,
        border: `1px solid ${colors.gray.border}`,
        borderRadius: '12px',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: '500',
        color: colors.primary,
        cursor: 'pointer',
        marginBottom: '12px',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appleButton: {
        backgroundColor: colors.gray.light,
    },
    switchContainer: {
        marginTop: '20px',
        textAlign: 'center',
    },
    switchText: {
        fontSize: '14px',
        color: colors.gray.dark,
        margin: 0,
    },
    switchLink: {
        color: colors.primary,
        fontWeight: '600',
        textDecoration: 'none',
    },
    termsText: {
        fontSize: '12px',
        color: colors.gray.medium,
        textAlign: 'center',
        marginTop: '32px',
        lineHeight: '18px',
    },
    termsLink: {
        color: colors.primary,
        textDecoration: 'underline',
    },
};
export default LoginNew;
