import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

interface Family {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  isActive: boolean;
}

const Families: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
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
    } catch (error) {
      console.error('Failed to load families:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    try {
      await axiosInstance.post('/bulk/families', newFamily);
      setNewFamily({ name: '', description: '' });
      setShowModal(false);
      loadFamilies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create family');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Families Management</h1>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Create Family
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading families...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(family => (
              <div key={family._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-2">{family.name}</h3>
                {family.description && (
                  <p className="text-sm text-gray-600 mb-3">{family.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {family.members?.length || 0} members
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    family.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {family.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {families.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No families yet. Create one to get started!
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Create New Family</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Family Name</label>
                  <input
                    className="input"
                    value={newFamily.name}
                    onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
                    placeholder="e.g., Smith Family"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={newFamily.description}
                    onChange={(e) => setNewFamily({ ...newFamily, description: e.target.value })}
                    placeholder="Brief description..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={createFamily} disabled={!newFamily.name}>
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Families;
