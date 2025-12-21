import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const Families = () => {
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newFamily, setNewFamily] = useState({ name: '', description: '' });
    useEffect(() => {
        loadFamilies();
    }, []);
    const loadFamilies = async () => {
        try {
            const res = await axiosInstance.get('/bulk/families');
            setFamilies(res.data || []);
        }
        catch (error) {
            console.error('Failed to load families:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const createFamily = async () => {
        try {
            await axiosInstance.post('/bulk/families', newFamily);
            setNewFamily({ name: '', description: '' });
            setShowModal(false);
            loadFamilies();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to create family');
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Families Management" }), _jsx("button", { className: "btn-primary", onClick: () => setShowModal(true), children: "+ Create Family" })] }), loading ? (_jsx("div", { className: "text-center py-8", children: "Loading families..." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: families.map(family => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-bold mb-2", children: family.name }), family.description && (_jsx("p", { className: "text-sm text-gray-600 mb-3", children: family.description })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [family.members?.length || 0, " members"] }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${family.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: family.isActive ? 'Active' : 'Inactive' })] })] }, family._id))) })), families.length === 0 && !loading && (_jsx("div", { className: "text-center py-12 text-gray-500", children: "No families yet. Create one to get started!" })), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg max-w-md w-full", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Create New Family" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Family Name" }), _jsx("input", { className: "input", value: newFamily.name, onChange: (e) => setNewFamily({ ...newFamily, name: e.target.value }), placeholder: "e.g., Smith Family" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Description (optional)" }), _jsx("textarea", { className: "input", rows: 3, value: newFamily.description, onChange: (e) => setNewFamily({ ...newFamily, description: e.target.value }), placeholder: "Brief description..." })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("button", { className: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded", onClick: () => setShowModal(false), children: "Cancel" }), _jsx("button", { className: "btn-primary", onClick: createFamily, disabled: !newFamily.name, children: "Create" })] })] })] }) }))] }) }));
};
export default Families;
