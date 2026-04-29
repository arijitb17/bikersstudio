"use client";

import React, { useState } from 'react';
import { Plus, FileSpreadsheet, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { api } from './api';
import { MENU_ITEMS } from './constants';
import { DashboardView } from './views/DashboardView';
import { MenuJsonView } from './views/MenuJsonView';
import { VideosView } from './views';
import { TestimonialsView } from './views/TestimonialsView';
import {
  ProductsView,
  CategoriesView,
  BrandsView,
  BikesView,
  MenuItemsView,
  OrdersView,
  BannersView,
  CouponsView,
  ReviewsView,
  ImagesView,
  UsersView,
} from './views';
import { Modal } from './modals/Modal';
import { Drawer } from './components/Drawer';         
import { BulkImportModal, type ImportResult } from './modals/BulkImportModal';
import { TabType, ModalType } from './types';

interface AdminItem {
  id?: string;
  [key: string]: unknown;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('create');
  const [selectedItem, setSelectedItem] = useState<AdminItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const openModal = (type: ModalType, item: AdminItem | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('edit');
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await api.uploadImage(file);
      callback(url);
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBulkImport = async (type: string, file: File): Promise<ImportResult> => {
    setLoading(true);
    try {
      const result = await api.bulkImport(type, file);
      setRefreshTrigger(prev => prev + 1);
      return result as ImportResult;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (
    endpoint: string,
    data: Record<string, unknown>,
    method: 'POST' | 'PUT' = 'POST'
  ) => {
    try {
      setLoading(true);
      await api.saveData(endpoint, data, method);
      alert('Saved successfully!');
      closeModal();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert('Save failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (endpoint: string, id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    try {
      await api.deleteData(endpoint, id);
      alert('Deleted successfully!');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert('Delete failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut({ callbackUrl: '/auth/signin' });
    }
  };

  // Derive a human-readable title for the drawer header
  const drawerTitle =
    modalType === 'create'
      ? `Add New ${MENU_ITEMS.find(m => m.id === activeTab)?.label ?? ''}`
      : `Edit ${MENU_ITEMS.find(m => m.id === activeTab)?.label ?? ''}`;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'users':
        return (
          <UsersView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/users', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'products':
        return (
          <ProductsView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/products', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/categories', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'brands':
        return (
          <BrandsView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/brands', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'bikes':
        return (
          <BikesView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/bikes', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'menu-json':
        return <MenuJsonView />;
      case 'menu-items':
        return (
          <MenuItemsView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/menu-items', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'orders':
        return <OrdersView refreshTrigger={refreshTrigger} />;
      case 'banners':
        return (
          <BannersView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/banners', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'coupons':
        return (
          <CouponsView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/coupons', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'reviews':
        return (
          <ReviewsView
            onDelete={(id: string, name: string) => handleDelete('/reviews', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'testimonials':
        return (
          <TestimonialsView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/testimonials', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'images':
        return <ImagesView refreshTrigger={refreshTrigger} />;
      case 'videos':
        return (
          <VideosView
            onEdit={(item: AdminItem) => openModal('edit', item)}
            onDelete={(id: string, name: string) => handleDelete('/admin/videos', id, name)}
            refreshTrigger={refreshTrigger}
          />
        );
      default:
        return <DashboardView />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access the admin panel</p>
        </div>
      </div>
    );
  }

  const userInitials = session.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : session.user?.email?.[0].toUpperCase() || 'A';

  return (
    <div className="flex h-screen bg-gray-50 pt-35">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">E-Commerce Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-white">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{userInitials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {session.user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user?.email || 'No email'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">
              {MENU_ITEMS.find(m => m.id === activeTab)?.label || 'Dashboard'}
            </h2>

            <div className="flex items-center gap-4">
              {activeTab !== 'dashboard' &&
               activeTab !== 'orders' &&
               activeTab !== 'reviews' &&
               activeTab !== 'images' &&
               activeTab !== 'users' &&
               activeTab !== 'menu-json' && (
                <>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet size={20} />
                    <span className="text-white">Bulk Import</span>
                  </button>
                  <button
                    onClick={() => openModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-white">Add New</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>

      {/* ── Drawer (replaces scroll-to-top modal) ──────────────────────────── */}
      <Drawer
        open={showModal}
        onClose={closeModal}
        title={drawerTitle}
        width="680px"
      >
        {showModal && (
          <Modal
            type={modalType}
            activeTab={activeTab}
            item={selectedItem}
            onClose={closeModal}
            onSave={handleSave}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
            loading={loading}
          />
        )}
      </Drawer>

      {showBulkImport && (
        <BulkImportModal
          type={activeTab}
          onClose={() => setShowBulkImport(false)}
          onImport={handleBulkImport}
          loading={loading}
        />
      )}
    </div>
  );
}