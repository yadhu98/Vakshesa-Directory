import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
import { Trash2, Upload, X, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PageLoader, ButtonLoader } from '@components/Loader';
const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [houseFilter, setHouseFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [generationFilter, setGenerationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [importPreview, setImportPreview] = useState([]);
    const [importFile, setImportFile] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'user',
        isActive: true,
        address: '',
    });
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            const res = await axiosInstance.get('/bulk/users');
            setUsers(res.data.users || []);
        }
        catch (error) {
            console.error('Failed to load users:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleUserStatus = async (userId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
            try {
                await axiosInstance.patch(`/users/${userId}/status`, {
                    isActive: !currentStatus,
                });
                toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
                loadUsers();
            }
            catch (error) {
                toast.error(error.response?.data?.message || 'Failed to toggle user status');
            }
        }
    };
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            address: user.address || '',
        });
        setShowEditModal(true);
    };
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser)
            return;
        setEditLoading(true);
        try {
            await axiosInstance.put(`/users/${editingUser._id}`, editForm);
            const wasDowngraded = editForm.role === 'user' && editingUser.role === 'admin';
            toast.success(`User ${wasDowngraded ? 'downgraded' : 'updated'} successfully!`);
            if (wasDowngraded) {
                toast((t) => (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("span", { children: "User role changed to \"user\". Now you can delete them." }), _jsx("button", { onClick: () => toast.dismiss(t.id), className: "text-xs underline", children: "Dismiss" })] })));
            }
            setShowEditModal(false);
            loadUsers();
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
        finally {
            setEditLoading(false);
        }
    };
    const handleDeleteAllUsers = async () => {
        if (deleteConfirmText !== 'DELETE_ALL_USERS') {
            toast.error('Please type DELETE_ALL_USERS to confirm');
            return;
        }
        setDeleteLoading(true);
        try {
            console.log('Calling deleteAllUsers API...');
            const response = await axiosInstance.delete('/bulk/delete-all-users', {
                data: { confirmCode: 'DELETE_ALL_USERS' }
            });
            console.log('Delete response:', response.data);
            toast.success(`Successfully deleted ${response.data.deletedCount} users. ${response.data.superAdminsPreserved} super admin(s) preserved.`);
            setShowDeleteModal(false);
            setDeleteConfirmText('');
            await loadUsers();
        }
        catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to delete users');
        }
        finally {
            setDeleteLoading(false);
        }
    };
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setImportFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    };
    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            toast.error('CSV file must contain header and at least one data row');
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim());
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const user = {};
            headers.forEach((header, index) => {
                if (values[index]) {
                    user[header] = values[index];
                }
            });
            if (user.firstName && user.lastName && user.email) {
                users.push(user);
            }
        }
        setImportPreview(users);
    };
    const handleImportUsers = async () => {
        if (importPreview.length === 0) {
            toast.error('No valid users to import');
            return;
        }
        setImportLoading(true);
        try {
            const response = await axiosInstance.post('/bulk/import-users', { users: importPreview });
            toast.success(`Successfully imported ${response.data.created} users. ${response.data.failed} failed.`);
            setShowImportModal(false);
            setImportPreview([]);
            setImportFile(null);
            loadUsers();
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import users');
        }
        finally {
            setImportLoading(false);
        }
    };
    const handleDeleteUser = async (userId, userName) => {
        const user = users.find(u => u._id === userId);
        if (!user)
            return;
        if (user.role === 'admin') {
            toast.error('Cannot delete admin users. Please change their role to "user" first.');
            handleEditClick(user);
            return;
        }
        if (confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
            setDeleteLoading(true);
            try {
                await axiosInstance.delete(`/users/${userId}`);
                toast.success(`User ${userName} deleted successfully!`);
                loadUsers();
            }
            catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
            finally {
                setDeleteLoading(false);
            }
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesHouse = houseFilter === 'all' || user.house === houseFilter;
        const matchesGender = genderFilter === 'all' || user.gender === genderFilter;
        const matchesGeneration = generationFilter === 'all' || user.generation?.toString() === generationFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive) ||
            (statusFilter === 'alive' && user.isAlive !== false) ||
            (statusFilter === 'deceased' && user.isAlive === false);
        return matchesSearch && matchesRole && matchesHouse && matchesGender && matchesGeneration && matchesStatus;
    });
    return (_jsxs(Layout, { children: [_jsx(Toaster, { position: "top-right" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Users Management" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { className: "px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center gap-2", onClick: () => setShowImportModal(true), children: [_jsx(Upload, { size: 16 }), "Import Users"] }), _jsxs("button", { className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2", onClick: () => setShowDeleteModal(true), children: [_jsx(Trash2, { size: 16 }), "Delete All Users"] }), _jsx("button", { className: "btn-primary", onClick: () => navigate('/register-user'), children: "+ Add User" })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsx("input", { type: "text", placeholder: "Search by name or email...", className: "input md:col-span-2 lg:col-span-3", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), _jsxs("select", { className: "input", value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "user", children: "Users" }), _jsx("option", { value: "admin", children: "Admins" })] }), _jsxs("select", { className: "input", value: houseFilter, onChange: (e) => setHouseFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Houses" }), _jsx("option", { value: "Kadannamanna", children: "Kadannamanna" }), _jsx("option", { value: "Ayiranazhi", children: "Ayiranazhi" }), _jsx("option", { value: "Aripra", children: "Aripra" }), _jsx("option", { value: "Mankada", children: "Mankada" })] }), _jsxs("select", { className: "input", value: genderFilter, onChange: (e) => setGenderFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Genders" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "other", children: "Other" })] }), _jsxs("select", { className: "input", value: generationFilter, onChange: (e) => setGenerationFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Generations" }), Array.from(new Set(users.map(u => u.generation).filter(g => g !== undefined))).sort((a, b) => (a || 0) - (b || 0)).map(gen => (_jsx("option", { value: gen?.toString(), children: `Generation ${gen}` }, gen)))] }), _jsxs("select", { className: "input", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "alive", children: "Alive" }), _jsx("option", { value: "deceased", children: "Deceased" })] }), (roleFilter !== 'all' || houseFilter !== 'all' || genderFilter !== 'all' || generationFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (_jsx("button", { onClick: () => {
                                            setRoleFilter('all');
                                            setHouseFilter('all');
                                            setGenderFilter('all');
                                            setGenerationFilter('all');
                                            setStatusFilter('all');
                                            setSearchQuery('');
                                        }, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium", children: "Clear Filters" }))] }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Showing ", filteredUsers.length, " of ", users.length, " users"] }), loading ? (_jsx(PageLoader, {})) : (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-3 px-2", children: "Name" }), _jsx("th", { className: "text-left py-3 px-2", children: "Email" }), _jsx("th", { className: "text-left py-3 px-2", children: "Phone" }), _jsx("th", { className: "text-left py-3 px-2", children: "Role" }), _jsx("th", { className: "text-left py-3 px-2", children: "Status" }), _jsx("th", { className: "text-left py-3 px-2 w-52", children: "Actions" })] }) }), _jsx("tbody", { children: filteredUsers.map(user => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsxs("td", { className: "py-3 px-2", children: [user.firstName, " ", user.lastName] }), _jsx("td", { className: "py-3 px-2", children: user.email }), _jsx("td", { className: "py-3 px-2", children: user.phone }), _jsx("td", { className: "py-3 px-2", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800'}`, children: user.role }) }), _jsx("td", { className: "py-3 px-2", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: user.isActive ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "py-3 px-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleEditClick(user), className: "px-3 py-1 bg-black text-white rounded hover:bg-gray-900 text-xs font-semibold", children: "Edit" }), _jsx("button", { onClick: () => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`), className: "px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold flex items-center gap-1", title: "Delete user", children: _jsx(Trash2, { size: 14 }) }), _jsx("label", { className: "flex items-center cursor-pointer", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "checkbox", className: "sr-only", checked: user.isActive, onChange: () => toggleUserStatus(user._id, user.isActive) }), _jsx("div", { className: `block w-10 h-6 rounded-full transition ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}` }), _jsx("div", { className: `dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${user.isActive ? 'translate-x-4' : ''}` })] }) })] }) })] }, user._id))) })] }), filteredUsers.length === 0 && (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No users found" }))] }))] }), showDeleteModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-2xl font-bold text-red-600", children: "Delete All Users" }), _jsx("button", { onClick: () => setShowDeleteModal(false), className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-gray-700 mb-4", children: "This will permanently delete ALL users except super admins. This action cannot be undone." }), _jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Type ", _jsx("strong", { children: "DELETE_ALL_USERS" }), " to confirm:"] }), _jsx("input", { type: "text", value: deleteConfirmText, onChange: (e) => setDeleteConfirmText(e.target.value), className: "input w-full", placeholder: "Type DELETE_ALL_USERS" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: () => {
                                                    setShowDeleteModal(false);
                                                    setDeleteConfirmText('');
                                                }, className: "flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: handleDeleteAllUsers, disabled: deleteConfirmText !== 'DELETE_ALL_USERS' || deleteLoading, className: "flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: deleteLoading ? 'Deleting...' : 'Delete All' })] })] }) }) })), showImportModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Import Users from CSV" }), _jsx("button", { onClick: () => {
                                                    setShowImportModal(false);
                                                    setImportPreview([]);
                                                    setImportFile(null);
                                                }, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Upload a CSV file with the following columns (required: firstName, lastName, email):" }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg mb-4", children: [_jsx("code", { className: "text-xs block mb-2", children: "firstName, lastName, email, phone, password, role, house, gender, address, occupation" }), _jsxs("div", { className: "text-xs text-gray-600 mt-2 space-y-1", children: [_jsxs("div", { children: [_jsx("strong", { children: "role:" }), " user | admin"] }), _jsxs("div", { children: [_jsx("strong", { children: "house:" }), " Kadannamanna | Ayiranazhi | Aripra | Mankada"] }), _jsxs("div", { children: [_jsx("strong", { children: "gender:" }), " male | female | other"] })] })] }), _jsx("label", { className: "block", children: _jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-black transition", children: [_jsx(FileText, { className: "mx-auto mb-2", size: 48 }), _jsx("span", { className: "text-gray-600", children: importFile ? importFile.name : 'Click to select CSV file' }), _jsx("input", { type: "file", accept: ".csv", onChange: handleFileUpload, className: "hidden" })] }) })] }), importPreview.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "font-bold mb-2", children: ["Preview (", importPreview.length, " users)"] }), _jsxs("div", { className: "overflow-x-auto max-h-64 border rounded", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left py-2 px-2", children: "First Name" }), _jsx("th", { className: "text-left py-2 px-2", children: "Last Name" }), _jsx("th", { className: "text-left py-2 px-2", children: "Email" }), _jsx("th", { className: "text-left py-2 px-2", children: "Phone" }), _jsx("th", { className: "text-left py-2 px-2", children: "Role" })] }) }), _jsx("tbody", { children: importPreview.slice(0, 10).map((user, index) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "py-2 px-2", children: user.firstName }), _jsx("td", { className: "py-2 px-2", children: user.lastName }), _jsx("td", { className: "py-2 px-2", children: user.email }), _jsx("td", { className: "py-2 px-2", children: user.phone || '-' }), _jsx("td", { className: "py-2 px-2", children: user.role || 'user' })] }, index))) })] }), importPreview.length > 10 && (_jsxs("p", { className: "text-center text-sm text-gray-500 py-2", children: ["...and ", importPreview.length - 10, " more"] }))] })] })), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: () => {
                                                    setShowImportModal(false);
                                                    setImportPreview([]);
                                                    setImportFile(null);
                                                }, className: "flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: handleImportUsers, disabled: importPreview.length === 0 || importLoading, className: "flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: importLoading ? (_jsxs(_Fragment, { children: [_jsx(ButtonLoader, {}), _jsx("span", { children: "Importing..." })] })) : (`Import ${importPreview.length} Users`) })] })] }) }) })), showEditModal && editingUser && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("h2", { className: "text-2xl font-bold mb-6", children: ["Edit User - ", editingUser.firstName, " ", editingUser.lastName] }), _jsxs("form", { onSubmit: handleUpdateUser, children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "First Name *" }), _jsx("input", { type: "text", value: editForm.firstName, onChange: (e) => setEditForm({ ...editForm, firstName: e.target.value }), className: "input w-full", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Last Name *" }), _jsx("input", { type: "text", value: editForm.lastName, onChange: (e) => setEditForm({ ...editForm, lastName: e.target.value }), className: "input w-full", required: true })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Email *" }), _jsx("input", { type: "email", value: editForm.email, onChange: (e) => setEditForm({ ...editForm, email: e.target.value }), className: "input w-full", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Phone *" }), _jsx("input", { type: "tel", value: editForm.phone, onChange: (e) => setEditForm({ ...editForm, phone: e.target.value }), className: "input w-full", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Role *" }), _jsxs("select", { value: editForm.role, onChange: (e) => setEditForm({ ...editForm, role: e.target.value }), className: "input w-full", required: true, children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Address" }), _jsx("textarea", { value: editForm.address || '', onChange: (e) => setEditForm({ ...editForm, address: e.target.value }), className: "input w-full", rows: 3, placeholder: "Enter address" })] }), _jsx("div", { className: "mb-6", children: _jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: editForm.isActive, onChange: (e) => setEditForm({ ...editForm, isActive: e.target.checked }), className: "mr-2" }), _jsx("span", { className: "text-sm font-semibold", children: "Active User" })] }) }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "button", onClick: () => setShowEditModal(false), className: "flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: editLoading, className: "flex-1 px-6 py-3 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: editLoading ? (_jsxs(_Fragment, { children: [_jsx(ButtonLoader, {}), _jsx("span", { children: "Updating..." })] })) : ('Update User') })] })] })] }) }) }))] })] }));
};
export default Users;
