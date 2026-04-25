// components/AddressForm.tsx

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  onSuccess: (address: Address) => void;
  initialData?: Partial<Address>;
  onCancel?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function AddressForm({ onSuccess, initialData, onCancel }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    country: initialData?.country || 'India',
    isDefault: initialData?.isDefault || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      setIsSubmitting(false);
      return;
    }

    if (!formData.street.trim()) {
      setError('Street address is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.city.trim()) {
      setError('City is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.state) {
      setError('Please select a state');
      setIsSubmitting(false);
      return;
    }

    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save address');
      }

      onSuccess(data.address);
    } catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Failed to save address');
}finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address *
        </label>
        <input
          type="text"
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="House/Flat No., Street Name, Area"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit pincode"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
      </div>

      {/* Country (Read-only) */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
          Country
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
        />
      </div>

      {/* Default Address Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
          Set as default address
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Address'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 bg-white hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
