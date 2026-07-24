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
  X,
  Package,
  Calendar,
  ShoppingBag
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = (profile.name || profile.email || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50 py-20 mt-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-black text-yellow-400 flex items-center justify-center font-black text-lg flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">My Profile</h1>
            <p className="text-neutral-500 text-sm font-mono">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-medium text-black hover:text-yellow-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-black text-yellow-400 rounded-lg hover:bg-neutral-900 disabled:bg-neutral-400 disabled:text-white font-bold text-sm uppercase transition-colors"
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
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 font-medium text-sm text-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-neutral-500 mb-1.5">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-black outline-none transition-shadow"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-black font-medium">
                      <User className="w-4 h-4 text-neutral-400" />
                      {profile.name || 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-neutral-500 mb-1.5">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-black font-medium">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    {profile.email}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-neutral-500 mb-1.5">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-black outline-none transition-shadow"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-black font-medium">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {profile.phone || 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-black" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">Saved Addresses</h2>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2 text-sm font-medium text-black hover:text-yellow-600 transition-colors"
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
                    className="mt-2 text-sm text-neutral-500 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 mb-4 text-sm">No saved addresses</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="px-5 py-2.5 bg-black text-yellow-400 rounded-lg hover:bg-neutral-900 font-bold uppercase text-sm transition-colors"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : !showAddressForm ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border border-neutral-200 rounded-lg p-4 hover:border-black transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-black">
                              {address.fullName}
                            </p>
                            {address.isDefault && (
                              <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">{address.street}</p>
                          <p className="text-sm text-neutral-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-neutral-600">Phone: {address.phone}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-sm font-medium text-black hover:text-yellow-600 underline decoration-yellow-400 underline-offset-4 transition-colors"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-neutral-400 hover:text-black transition-colors"
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
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200 sticky top-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-5">Account Overview</h2>

              <div className="space-y-1">
                <div className="flex items-center justify-between py-3.5 border-b border-neutral-200">
                  <span className="text-neutral-600 flex items-center gap-2 text-sm">
                    <ShoppingBag className="w-4 h-4 text-neutral-400" />
                    Total Orders
                  </span>
                  <span className="font-black text-black tabular-nums bg-yellow-400 px-2 py-0.5 rounded">
                    {orderCount}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3.5 border-b border-neutral-200">
                  <span className="text-neutral-600 flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-neutral-400" />
                    Saved Addresses
                  </span>
                  <span className="font-black text-black tabular-nums">{addresses.length}</span>
                </div>

                <div className="flex items-center justify-between py-3.5">
                  <span className="text-neutral-600 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    Member Since
                  </span>
                  <span className="font-semibold text-black text-sm">
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
                className="w-full mt-6 px-4 py-3 bg-black text-yellow-400 rounded-lg hover:bg-neutral-900 transition-colors font-bold uppercase text-sm border border-transparent hover:border-yellow-400"
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