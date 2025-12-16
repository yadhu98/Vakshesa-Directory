import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { authService } from '@services/api';
import axiosInstance from '@services/api';
import { useNavigate } from 'react-router-dom';
const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        validationCode: '',
        isSuperUser: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeCodes, setActiveCodes] = useState([]);
    const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const loadCodes = async () => {
        setError('');
        try {
            const res = await axiosInstance.get('/admin/admin-codes');
            setActiveCodes(res.data.codes || []);
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to load codes (login as admin to view)');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        console.log('[Register] submit clicked', { ...form, password: '***' });
        if (form.role === 'admin' && !form.isSuperUser && !form.validationCode) {
            setError('Admin registration requires a validation code.');
            return;
        }
        setLoading(true);
        try {
            const payload = { ...form };
            console.log('[Register] calling /auth/register with', { ...payload, password: '***' });
            const response = await authService.register(payload);
            setSuccess('Registration successful. You can now login.');
            setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user', validationCode: '', isSuperUser: false });
            if (response.user?.role === 'admin') {
                if (response.user?.isSuperUser) {
                    localStorage.setItem('authToken', response.token);
                    navigate('/dashboard');
                }
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 py-8", children: _jsx("div", { className: "w-full max-w-2xl bg-white p-6 rounded-lg shadow", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Create Account" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Register a regular user or an admin. Regular admin requires a validation code from an existing admin. Super User can register directly without a code and auto logs in." }), error && _jsx("div", { className: "bg-red-100 text-red-700 px-4 py-2 rounded mb-4", children: error }), success && _jsx("div", { className: "bg-green-100 text-green-700 px-4 py-2 rounded mb-4", children: success }), _jsxs("form", { noValidate: true, onSubmit: handleSubmit, className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "First Name" }), _jsx("input", { className: "input", value: form.firstName, onChange: (e) => update('firstName', e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Last Name" }), _jsx("input", { className: "input", value: form.lastName, onChange: (e) => update('lastName', e.target.value), required: true })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Email" }), _jsx("input", { type: "email", className: "input", value: form.email, onChange: (e) => update('email', e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Phone" }), _jsx("input", { className: "input", value: form.phone, onChange: (e) => update('phone', e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Password" }), _jsx("input", { type: "password", className: "input", value: form.password, onChange: (e) => update('password', e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Role" }), _jsxs("select", { className: "input", value: form.role, onChange: (e) => update('role', e.target.value), children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), form.role === 'admin' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Validation Code" }), _jsx("input", { className: "input", value: form.validationCode, onChange: (e) => update('validationCode', e.target.value), placeholder: "6-digit code", disabled: form.isSuperUser })] })), form.role === 'admin' && (_jsxs("div", { className: "flex items-center gap-2 md:col-span-2", children: [_jsx("input", { type: "checkbox", id: "isSuperUser", checked: form.isSuperUser, onChange: (e) => update('isSuperUser', e.target.checked) }), _jsx("label", { htmlFor: "isSuperUser", className: "text-sm", children: "Super User (bypass code & auto-login)" })] })), _jsxs("div", { className: "md:col-span-2 flex justify-between items-center mt-2", children: [_jsx("button", { type: "submit", disabled: loading, className: "btn-primary px-6 py-2 disabled:opacity-50", children: loading ? 'Registering...' : 'Register' }), form.role === 'admin' && (_jsx("button", { type: "button", onClick: loadCodes, className: "text-sm text-blue-600 hover:text-blue-700 underline", children: "View Active Codes" }))] })] }), activeCodes.length > 0 && (_jsxs("div", { className: "mt-4 bg-blue-50 p-3 rounded", children: [_jsx("p", { className: "text-sm font-medium mb-2", children: "Active Admin Codes (expires quickly):" }), _jsx("ul", { className: "text-xs space-y-1", children: activeCodes.map(c => (_jsxs("li", { className: "flex justify-between", children: [_jsx("span", { children: c.code }), _jsx("span", { children: new Date(c.expiresAt).toLocaleTimeString() })] }, c.code))) })] })), _jsx("div", { className: "text-center mt-6 text-sm", children: _jsx("button", { onClick: () => navigate('/login'), className: "text-gray-600 hover:text-gray-800 underline", children: "Back to Login" }) })] }) }) }));
};
export default Register;
