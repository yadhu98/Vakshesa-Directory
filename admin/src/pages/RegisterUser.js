import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { authService } from '@services/api';
import axiosInstance from '@services/api';
import { Layout } from '@components/Layout';
const RegisterUser = () => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        familyId: '',
        house: 'Kadannamanna',
    });
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useEffect(() => {
        const loadFamilies = async () => {
            try {
                const res = await axiosInstance.get('/bulk/families');
                setFamilies(res.data || []);
            }
            catch (e) {
                // ignore families load failure
            }
        };
        loadFamilies();
    }, []);
    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const payload = { ...form };
            if (!payload.familyId) {
                delete payload.familyId;
            }
            await authService.register(payload);
            setSuccess('User registered successfully');
            setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user', familyId: '', house: 'Kadannamanna' });
        }
        catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "max-w-2xl mx-auto bg-white p-6 rounded-lg shadow space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Register New User" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Create admin, user, or shopkeeper accounts. Password will be stored securely." }), error && _jsx("div", { className: "bg-red-100 text-red-700 px-4 py-2 rounded", children: error }), success && _jsx("div", { className: "bg-green-100 text-green-700 px-4 py-2 rounded", children: success }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "First Name" }), _jsx("input", { className: "input", value: form.firstName, onChange: (e) => updateField('firstName', e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Last Name" }), _jsx("input", { className: "input", value: form.lastName, onChange: (e) => updateField('lastName', e.target.value), required: true })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Email" }), _jsx("input", { type: "email", className: "input", value: form.email, onChange: (e) => updateField('email', e.target.value), required: true })] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Phone" }), _jsx("input", { className: "input", value: form.phone, onChange: (e) => updateField('phone', e.target.value), required: true })] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Password" }), _jsx("input", { type: "password", className: "input", value: form.password, onChange: (e) => updateField('password', e.target.value), required: true })] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Role" }), _jsxs("select", { className: "input", value: form.role, onChange: (e) => updateField('role', e.target.value), children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "shopkeeper", children: "Shopkeeper" })] })] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Family (optional)" }), _jsxs("select", { className: "input", value: form.familyId, onChange: (e) => updateField('familyId', e.target.value), children: [_jsx("option", { value: "", children: "-- None / Default --" }), families.map((f) => (_jsx("option", { value: f._id || f.name, children: f.name }, f._id || f.name)))] })] }), _jsxs("div", { className: "md:col-span-1", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "House *" }), _jsxs("select", { className: "input", value: form.house, onChange: (e) => updateField('house', e.target.value), required: true, children: [_jsx("option", { value: "Kadannamanna", children: "Kadannamanna" }), _jsx("option", { value: "Ayiranazhi", children: "Ayiranazhi" }), _jsx("option", { value: "Aripra", children: "Aripra" }), _jsx("option", { value: "Mankada", children: "Mankada" })] })] }), _jsx("div", { className: "md:col-span-2 flex justify-end", children: _jsx("button", { type: "submit", disabled: loading, className: "btn-primary px-6 py-2 disabled:opacity-50", children: loading ? 'Registering...' : 'Register User' }) })] })] }) }));
};
export default RegisterUser;
