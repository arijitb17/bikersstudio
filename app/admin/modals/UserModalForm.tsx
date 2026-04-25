// app/admin/modals/UserModalForm.tsx

import React, { useState, useEffect } from 'react';
import { X, Mail, User, Phone, Shield, Lock } from 'lucide-react';
import type { AdminItem, UserFormData } from '../types';

interface UserModalFormProps {
  type: 'create' | 'edit';
  item: AdminItem | null;
  onClose: () => void;
  onSave: (endpoint: string, data: AdminItem, method: 'POST' | 'PUT') => Promise<void>;
  loading: boolean;
}

export function UserModalForm({ type, item, onClose, onSave, loading }: UserModalFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    id: '',
    email: '',
    name: '',
    phone: '',
    role: 'USER',
    password: '',
  });

  useEffect(() => {
    if (type === 'edit' && item) {
      setFormData({
        id: (item.id as string) || '',
        email: (item.email as string) || '',
        name: (item.name as string) || '',
        phone: (item.phone as string) || '',
        role: (item.role as 'USER' | 'ADMIN') || 'USER',
        password: '', // Never pre-fill password
      });
    } else {
      setFormData({
        id: '',
        email: '',
        name: '',
        phone: '',
        role: 'USER',
        password: '',
      });
    }
  }, [type, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      alert('Email is required');
      return;
    }

    if (type === 'create' && !formData.password) {
      alert('Password is required for new users');
      return;
    }

    const endpoint = `/users/${formData.id}`;
    const method = 'PUT' as const;

    onSave(endpoint, formData, method);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 text-gray-500">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
  Edit User
</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
              placeholder="+91 98765 43210"
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield size={16} className="inline mr-2" />
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
              disabled={loading}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Password {type === 'create' && '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={type === 'create'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
              placeholder={type === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
              disabled={loading}
              minLength={6}
            />
            {type === 'edit' && (
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to keep the current password
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : type === 'create' ? 'Create User' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}