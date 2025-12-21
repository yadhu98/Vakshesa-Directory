import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
import { Trash2, Upload, X, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PageLoader, ButtonLoader } from '@components/Loader';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  familyId: string;
  isActive: boolean;
  address?: string;
}

interface EditUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  address?: string;
}

interface ImportUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role?: string;
  house?: string;
  gender?: string;
  generation?: string;
  address?: string;
  profession?: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [importPreview, setImportPreview] = useState<ImportUser[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUser>({
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
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      try {
        await axiosInstance.patch(`/users/${userId}/status`, {
          isActive: !currentStatus,
        });
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        loadUsers();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to toggle user status');
      }
    }
  };

  const handleEditClick = (user: User) => {
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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      await axiosInstance.put(`/users/${editingUser._id}`, editForm);
      const wasDowngraded = editForm.role === 'user' && editingUser.role === 'admin';
      toast.success(`User ${wasDowngraded ? 'downgraded' : 'updated'} successfully!`);
      
      if (wasDowngraded) {
        toast((t) => (
          <div className="flex gap-2 items-center">
            <span>User role changed to "user". Now you can delete them.</span>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        ));
      }
      
      setShowEditModal(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
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
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete users');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };

    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      toast.error('CSV file must contain header and at least one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const users: ImportUser[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const user: any = {};
      
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import users');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

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
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Users Management</h1>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center gap-2"
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} />
              Import Users
            </button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} />
              Delete All Users
            </button>
            <button className="btn-primary" onClick={() => window.location.href = '/register-user'}>
              + Add User
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search users..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {loading ? (
            <PageLoader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Phone</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2 w-52">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">{user.firstName} {user.lastName}</td>
                      <td className="py-3 px-2">{user.email}</td>
                      <td className="py-3 px-2">{user.phone}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-900 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold flex items-center gap-1"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={user.isActive}
                                onChange={() => toggleUserStatus(user._id, user.isActive)}
                              />
                              <div className={`block w-10 h-6 rounded-full transition ${
                                user.isActive ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                                user.isActive ? 'translate-x-4' : ''
                              }`}></div>
                            </div>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Delete All Users Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-red-600">Delete All Users</h2>
                  <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    This will permanently delete ALL users except super admins. This action cannot be undone.
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Type <strong>DELETE_ALL_USERS</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="input w-full"
                    placeholder="Type DELETE_ALL_USERS"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllUsers}
                    disabled={deleteConfirmText !== 'DELETE_ALL_USERS' || deleteLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete All'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Users Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Import Users from CSV</h2>
                  <button onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                    setImportFile(null);
                  }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a CSV file with the following columns (required: firstName, lastName, email):
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <code className="text-xs block mb-2">
                      firstName, lastName, email, phone, password, role, house, gender, address, occupation
                    </code>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <div><strong>role:</strong> user | admin</div>
                      <div><strong>house:</strong> Kadannamanna | Ayiranazhi | Aripra | Mankada</div>
                      <div><strong>gender:</strong> male | female | other</div>
                    </div>
                  </div>
                  
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-black transition">
                      <FileText className="mx-auto mb-2" size={48} />
                      <span className="text-gray-600">
                        {importFile ? importFile.name : 'Click to select CSV file'}
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>

                {importPreview.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Preview ({importPreview.length} users)</h3>
                    <div className="overflow-x-auto max-h-64 border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-2">First Name</th>
                            <th className="text-left py-2 px-2">Last Name</th>
                            <th className="text-left py-2 px-2">Email</th>
                            <th className="text-left py-2 px-2">Phone</th>
                            <th className="text-left py-2 px-2">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 10).map((user, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-2">{user.firstName}</td>
                              <td className="py-2 px-2">{user.lastName}</td>
                              <td className="py-2 px-2">{user.email}</td>
                              <td className="py-2 px-2">{user.phone || '-'}</td>
                              <td className="py-2 px-2">{user.role || 'user'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.length > 10 && (
                        <p className="text-center text-sm text-gray-500 py-2">
                          ...and {importPreview.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportPreview([]);
                      setImportFile(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportUsers}
                    disabled={importPreview.length === 0 || importLoading}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importLoading ? (
                      <>
                        <ButtonLoader />
                        <span>Importing...</span>
                      </>
                    ) : (
                      `Import ${importPreview.length} Users`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Edit User - {editingUser.firstName} {editingUser.lastName}</h2>
                <form onSubmit={handleUpdateUser}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">First Name *</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Address</label>
                    <textarea
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="input w-full"
                      rows={3}
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-semibold">Active User</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 px-6 py-3 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {editLoading ? (
                        <>
                          <ButtonLoader />
                          <span>Updating...</span>
                        </>
                      ) : (
                        'Update User'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
