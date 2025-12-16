import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TokenAccount {
  userId: string;
  balance: number;
  qrCode: string;
}

const TokenRecharge: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tokenAccount, setTokenAccount] = useState<TokenAccount | null>(null);
  const [tokens, setTokens] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await axiosInstance.get('/bulk/users');
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setMessage(null);
    
    try {
      const res = await axiosInstance.get('/tokens/balance', { params: { userId: user._id } });
      setTokenAccount(res.data.tokenAccount);
    } catch (error) {
      setTokenAccount(null);
    }
  };

  const handleQRScan = async () => {
    if (!qrCodeInput) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await axiosInstance.post('/tokens/recharge', {
        qrCode: qrCodeInput,
        tokens: 0,
        amount: 0,
      });
      // This will fail but give us user info
    } catch (error: any) {
      // Get token account by QR
      try {
        const res = await axiosInstance.get('/tokens/balance', { params: { qrCode: qrCodeInput } });
        setTokenAccount(res.data.tokenAccount);
        const user = users.find(u => u._id === res.data.tokenAccount.userId);
        if (user) setSelectedUser(user);
      } catch (err) {
        setMessage({ type: 'error', text: 'Invalid QR code' });
      }
    } finally {
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
      const payload: any = {
        tokens: Number(tokens),
        amount: Number(amount) || 0,
        description,
      };

      if (qrCodeInput) {
        payload.qrCode = qrCodeInput;
      } else if (selectedUser) {
        payload.userId = selectedUser._id;
      } else {
        setMessage({ type: 'error', text: 'Please select a user or scan QR code' });
        setLoading(false);
        return;
      }

      const res = await axiosInstance.post('/tokens/recharge', payload);
      setMessage({ type: 'success', text: `Successfully recharged ${tokens} tokens!` });
      setTokenAccount({ ...tokenAccount!, balance: res.data.newBalance });
      setTokens('');
      setAmount('');
      setDescription('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Recharge failed' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">💰 Token Recharge</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Scanner */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Scan User QR Code</h2>
            <div className="space-y-4">
              <div>
                <input
                  className="input"
                  placeholder="Paste QR code data or scan..."
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" onClick={handleQRScan} disabled={!qrCodeInput || loading}>
                Lookup User
              </button>
            </div>
          </div>

          {/* User Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Or Select User</h2>
            <input
              className="input mb-4"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredUsers.slice(0, 10).map(user => (
                <div
                  key={user._id}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedUser?._id === user._id ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected User & Recharge Form */}
        {(selectedUser || tokenAccount) && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Recharge Tokens</h2>
            
            {selectedUser && (
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="font-medium text-lg">{selectedUser.firstName} {selectedUser.lastName}</div>
                <div className="text-sm text-gray-600">{selectedUser.email}</div>
                {tokenAccount && (
                  <div className="mt-2">
                    <span className="text-xl font-bold text-green-600">
                      Current Balance: {tokenAccount.balance} tokens
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tokens to Add *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g., 100"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid (optional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g., 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                className="input"
                placeholder="e.g., Cash payment received"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleRecharge}
              disabled={loading || !tokens}
            >
              {loading ? 'Processing...' : 'Recharge Tokens'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TokenRecharge;
