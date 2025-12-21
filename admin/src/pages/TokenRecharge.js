import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const TokenRecharge = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [tokenAccount, setTokenAccount] = useState(null);
    const [tokens, setTokens] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [qrCodeInput, setQrCodeInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState(null);
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
    };
    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setMessage(null);
        try {
            const res = await axiosInstance.get('/tokens/balance', { params: { userId: user._id } });
            setTokenAccount(res.data.tokenAccount);
        }
        catch (error) {
            setTokenAccount(null);
        }
    };
    const handleQRScan = async () => {
        if (!qrCodeInput)
            return;
        setLoading(true);
        setMessage(null);
        try {
            const res = await axiosInstance.post('/tokens/recharge', {
                qrCode: qrCodeInput,
                tokens: 0,
                amount: 0,
            });
            // This will fail but give us user info
        }
        catch (error) {
            // Get token account by QR
            try {
                const res = await axiosInstance.get('/tokens/balance', { params: { qrCode: qrCodeInput } });
                setTokenAccount(res.data.tokenAccount);
                const user = users.find(u => u._id === res.data.tokenAccount.userId);
                if (user)
                    setSelectedUser(user);
            }
            catch (err) {
                setMessage({ type: 'error', text: 'Invalid QR code' });
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleRecharge = async () => {
        if (!tokens || Number(tokens) <= 0) {
            setMessage({ type: 'error', text: 'Please enter valid token amount' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const payload = {
                tokens: Number(tokens),
                amount: Number(amount) || 0,
                description,
            };
            if (qrCodeInput) {
                payload.qrCode = qrCodeInput;
            }
            else if (selectedUser) {
                payload.userId = selectedUser._id;
            }
            else {
                setMessage({ type: 'error', text: 'Please select a user or scan QR code' });
                setLoading(false);
                return;
            }
            const res = await axiosInstance.post('/tokens/recharge', payload);
            setMessage({ type: 'success', text: `Successfully recharged ${tokens} tokens!` });
            setTokenAccount({ ...tokenAccount, balance: res.data.newBalance });
            setTokens('');
            setAmount('');
            setDescription('');
        }
        catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Recharge failed' });
        }
        finally {
            setLoading(false);
        }
    };
    const filteredUsers = users.filter(u => u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\uD83D\uDCB0 Token Recharge" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Scan User QR Code" }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { className: "input", placeholder: "Paste QR code data or scan...", value: qrCodeInput, onChange: (e) => setQrCodeInput(e.target.value) }) }), _jsx("button", { className: "btn-primary w-full", onClick: handleQRScan, disabled: !qrCodeInput || loading, children: "Lookup User" })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Or Select User" }), _jsx("input", { className: "input mb-4", placeholder: "Search users...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), _jsx("div", { className: "max-h-64 overflow-y-auto space-y-2", children: filteredUsers.slice(0, 10).map(user => (_jsxs("div", { className: `p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedUser?._id === user._id ? 'bg-blue-50 border-blue-500' : ''}`, onClick: () => handleUserSelect(user), children: [_jsxs("div", { className: "font-medium", children: [user.firstName, " ", user.lastName] }), _jsx("div", { className: "text-sm text-gray-600", children: user.email })] }, user._id))) })] })] }), (selectedUser || tokenAccount) && (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Recharge Tokens" }), selectedUser && (_jsxs("div", { className: "mb-4 p-4 bg-gray-50 rounded", children: [_jsxs("div", { className: "font-medium text-lg", children: [selectedUser.firstName, " ", selectedUser.lastName] }), _jsx("div", { className: "text-sm text-gray-600", children: selectedUser.email }), tokenAccount && (_jsx("div", { className: "mt-2", children: _jsxs("span", { className: "text-xl font-bold text-green-600", children: ["Current Balance: ", tokenAccount.balance, " tokens"] }) }))] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Tokens to Add *" }), _jsx("input", { type: "number", className: "input", placeholder: "e.g., 100", value: tokens, onChange: (e) => setTokens(e.target.value), min: "1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Amount Paid (optional)" }), _jsx("input", { type: "number", className: "input", placeholder: "e.g., 500", value: amount, onChange: (e) => setAmount(e.target.value), min: "0" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Description (optional)" }), _jsx("input", { className: "input", placeholder: "e.g., Cash payment received", value: description, onChange: (e) => setDescription(e.target.value) })] }), message && (_jsx("div", { className: `mb-4 p-3 rounded ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'}`, children: message.text })), _jsx("button", { className: "btn-primary w-full", onClick: handleRecharge, disabled: loading || !tokens, children: loading ? 'Processing...' : 'Recharge Tokens' })] }))] }) }));
};
export default TokenRecharge;
