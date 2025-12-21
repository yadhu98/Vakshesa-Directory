import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        // Validation
        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setLoading(true);
        try {
            await axiosInstance.put('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
        catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password. Please check your current password.'
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Layout, { children: _jsx("div", { className: "max-w-md mx-auto", children: _jsxs("div", { className: "bg-white p-8 rounded-lg shadow", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Change Password" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Current Password" }), _jsx("input", { type: "password", name: "currentPassword", className: "input", value: formData.currentPassword, onChange: handleChange, required: true, autoComplete: "current-password" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "New Password" }), _jsx("input", { type: "password", name: "newPassword", className: "input", value: formData.newPassword, onChange: handleChange, required: true, minLength: 6, autoComplete: "new-password" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Minimum 6 characters" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Confirm New Password" }), _jsx("input", { type: "password", name: "confirmPassword", className: "input", value: formData.confirmPassword, onChange: handleChange, required: true, minLength: 6, autoComplete: "new-password" })] }), message && (_jsx("div", { className: `p-3 rounded ${message.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'}`, children: message.text })), _jsx("button", { type: "submit", className: "btn-primary w-full", disabled: loading, children: loading ? 'Changing Password...' : 'Change Password' })] })] }) }) }));
};
export default ChangePassword;
