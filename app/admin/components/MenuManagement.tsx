// admin/components/MenuManagement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
type MenuType = 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU';
interface MenuItem {
  id: string;
  name: string;
  slug: string;
  type: 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU';
  description?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  position: number;
  parentId?: string;
  brandId?: string;
  categoryId?: string;
  children?: MenuItem[];
  _count?: { children: number };
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'CATEGORY_MENU' as 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU',
    description: '',
    icon: '',
    image: '',
    isActive: true,
    position: 0,
    parentId: '',
    brandId: '',
    categoryId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, brandsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/menu-items'),
        fetch('/api/brands'),
        fetch('/api/categories')
      ]);

      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (brandsRes.ok) setBrands(await brandsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeMenuHierarchy = (items: MenuItem[]): MenuItem[] => {
    const itemMap = new Map<string, MenuItem>();
    const rootItems: MenuItem[] = [];

    // Create a map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build the hierarchy
    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuItem);
        } else {
          rootItems.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });

    // Sort by position
    const sortByPosition = (items: MenuItem[]) => {
      items.sort((a, b) => a.position - b.position);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByPosition(item.children);
        }
      });
    };

    sortByPosition(rootItems);
    return rootItems;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      parentId: formData.parentId || null,
      brandId: formData.brandId || null,
      categoryId: formData.categoryId || null,
      position: parseInt(formData.position.toString()) || 0
    };

    try {
      const url = editingItem 
        ? `/api/admin/menu-items/${editingItem.id}`
        : '/api/admin/menu-items';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save menu item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        slug: item.slug,
        type: item.type,
        description: item.description || '',
        icon: item.icon || '',
        image: item.image || '',
        isActive: item.isActive,
        position: item.position,
        parentId: item.parentId || '',
        brandId: item.brandId || '',
        categoryId: item.categoryId || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        slug: '',
        type: 'CATEGORY_MENU',
        description: '',
        icon: '',
        image: '',
        isActive: true,
        position: 0,
        parentId: '',
        brandId: '',
        categoryId: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} className="border-b border-gray-100">
        <div 
          className={`flex items-center gap-3 p-4 hover:bg-gray-50 ${level > 0 ? 'ml-' + (level * 8) : ''}`}
          style={{ paddingLeft: `${level * 32 + 16}px` }}
        >
          {/* Drag Handle */}
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />

          {/* Expand/Collapse */}
          {hasChildren ? (
            <button 
              onClick={() => toggleExpand(item.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Menu Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                item.type === 'BRAND_MENU' ? 'bg-blue-100 text-blue-700' :
                item.type === 'CATEGORY_MENU' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {item.type.replace('_', ' ')}
              </span>
              {!item.isActive && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">/{item.slug}</p>
            {item.description && (
              <p className="text-xs text-gray-400 mt-1">{item.description}</p>
            )}
          </div>

          {/* Position */}
          <div className="text-sm text-gray-500 w-16 text-center">
            Pos: {item.position}
          </div>

          {/* Child Count */}
          {hasChildren && (
            <div className="text-sm text-gray-500">
              {item.children!.length} items
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => openModal(item)}
              className="p-2 hover:bg-blue-50 rounded text-blue-600"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 hover:bg-red-50 rounded text-red-600"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const hierarchicalMenus = organizeMenuHierarchy(menuItems);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-500 mt-1">Manage your navigation menu structure</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          Add Menu Item
        </button>
      </div>

      {/* Menu Items List */}
      <div className="bg-white rounded-lg shadow">
        {hierarchicalMenus.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
        {/* eslint-disable-next-line react/no-unescaped-entities */}
            No menu items yet. Click "Add Menu Item" to create one.
          </div>
        ) : (
          <div>
            {hierarchicalMenus.map(item => renderMenuItem(item))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Menu Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Motorcycle Accessories"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="motorcycle-accessories"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly version (auto-generated if empty)
                </p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Menu Type *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as MenuType})}
                >
                  <option value="BRAND_MENU">Brand Menu (Shop by Bike)</option>
                  <option value="CATEGORY_MENU">Category Menu (Products)</option>
                  <option value="CUSTOM_MENU">Custom Menu</option>
                </select>
              </div>

              {/* Parent Menu */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Parent Menu
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.parentId}
                  onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                >
                  <option value="">None (Top Level)</option>
                  {menuItems
                    .filter(item => item.id !== editingItem?.id)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent to create a submenu item
                </p>
              </div>

              {/* Brand (if BRAND_MENU) */}
              {formData.type === 'BRAND_MENU' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Link to Brand
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg text-black"
                    value={formData.brandId}
                    onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                  >
                    <option value="">None</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category (if CATEGORY_MENU) */}
              {formData.type === 'CATEGORY_MENU' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Link to Category
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg text-black"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="">None</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Optional description for this menu item"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Icon (Lucide icon name)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="e.g., Bike, Helmet, Shield"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Position
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: parseInt(e.target.value) || 0})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                <label htmlFor="isActive" className="text-sm text-black">
                  Active (visible in menu)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingItem ? 'Update' : 'Create'} Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
