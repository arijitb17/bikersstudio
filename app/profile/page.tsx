// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';
import AddressForm from '@/components/AddressForm';

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

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [,] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile');
    }
  }, [status, router]);

  // Load profile and addresses
  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
      loadAddresses();
      loadOrderCount();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        setName(data.user.name || '');
        setPhone(data.user.phone || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      const data = await response.json();
      
      if (response.ok) {
        setAddresses(data.addresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const loadOrderCount = async () => {
    try {
      const response = await fetch('/api/user/orders');
      const data = await response.json();
      
      if (response.ok) {
        setOrderCount((data.orders ?? data.data ?? []).length);
      }
    } catch (error) {
      console.error('Error loading order count:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setIsEditing(false);
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
          },
        });
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAddresses(addresses.filter(a => a.id !== addressId));
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error deleting address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update addresses list
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId,
        })));
      } else {
        alert('Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Error setting default address');
    }
  };

  const handleAddressAdded = (newAddress: Address) => {
    setAddresses([newAddress, ...addresses]);
    setShowAddressForm(false);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 mt-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(profile.name);
                        setPhone(profile.phone || '');
                      }}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      {profile.name || 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {profile.email}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {profile.phone || 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-6">
                  <AddressForm onSuccess={handleAddressAdded} />
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No saved addresses</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : !showAddressForm ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-lg p-4 hover:border-red-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">
                              {address.fullName}
                            </p>
                            {address.isDefault && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{address.street}</p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                        </div>

                        <div className="flex gap-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-bold text-gray-900">{orderCount}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Saved Addresses</span>
                  <span className="font-bold text-gray-900">{addresses.length}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-bold text-gray-900">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/orders')}
                className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
