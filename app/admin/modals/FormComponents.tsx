// admin/modals/FormComponents.tsx

"use client"
import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { Category, Brand } from '../types';

// ---------------------------------------------------------------------------
// Shared form-data shapes
// ---------------------------------------------------------------------------

export interface CategoryFormData {
  name?: string;
  slug?: string;
  description?: string;
  position?: number | string;
  parentId?: string;
  showInMenu?: boolean;
  isActive?: boolean;
}

export interface BrandFormData {
  name?: string;
  slug?: string;
  logo?: string;
}

export interface BikeFormData {
  name?: string;
  slug?: string;
  brandId?: string;
  model?: string;
  year?: number;
  description?: string;
  image?: string;
  isActive?: boolean;
  position?: number;
}

export interface BannerFormData {
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  position?: number | string;
  isActive?: boolean;
}

export interface CouponFormData {
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number | string;
  validFrom?: string;
  validUntil?: string;
}

export interface MenuItemFormData {
  name?: string;
  slug?: string;
  type?: 'CATEGORY_MENU' | 'BRAND_MENU' | 'CUSTOM_MENU';
  categoryId?: string;
  image?: string;
  position?: number;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Category Form
// ---------------------------------------------------------------------------

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  categories: Category[];
  currentItemId?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ formData, setFormData, categories, currentItemId }) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Category Name *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.name || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Slug *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.slug || ''}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Description</label>
      <textarea
        rows={3}
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Position</label>
      <input
        type="number"
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.position ?? 0}
        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Parent Category</label>
      <select
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.parentId || ''}
        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
      >
        <option value="">None (Top Level)</option>
        {categories.filter(c => c.id !== currentItemId).map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.showInMenu ?? true}
          onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
        />
        <span className="text-sm text-black">Show in Menu</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive ?? true}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <span className="text-sm text-black">Active</span>
      </label>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Brand Form
// ---------------------------------------------------------------------------

interface BrandFormProps {
  formData: BrandFormData;
  setFormData: (data: BrandFormData) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage: boolean;
}

export const BrandForm: React.FC<BrandFormProps> = ({ formData, setFormData, onImageUpload, uploadingImage }) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Brand Name *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.name || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Slug *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.slug || ''}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Logo URL</label>
      <div className="space-y-2">
        {formData.logo && (
          <Image
            src={formData.logo}
            alt="Logo"
            width={128}
            height={128}
            className="object-contain border rounded"
          />
        )}
        <label className="inline-block px-4 py-2 bg-gray-100 border rounded-lg cursor-pointer hover:bg-gray-200">
          <ImageIcon size={16} className="inline mr-2" />
          <span className="text-black">{uploadingImage ? 'Uploading...' : 'Upload Logo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageUpload(e, (url) => setFormData({ ...formData, logo: url }))}
            disabled={uploadingImage}
          />
        </label>
      </div>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Bike Form
// ---------------------------------------------------------------------------

interface BikeFormProps {
  formData: BikeFormData;
  setFormData: (data: BikeFormData) => void;
  brands: Brand[];
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage?: boolean;
}

export const BikeForm: React.FC<BikeFormProps> = ({
  formData,
  setFormData,
  brands,
  onImageUpload,
  uploadingImage
}) => {
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({
      ...formData,
      name,
      slug: formData.slug || slug
    });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Bike Name *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Ninja 400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Slug *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 border rounded-lg text-black bg-gray-50"
          value={formData.slug || ''}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="Auto-generated from name"
        />
        <p className="text-xs text-gray-500 mt-1">Auto-generated from name (URL-friendly)</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Brand *</label>
        <select
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.brandId || ''}
          onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
        >
          <option value="">Select Brand</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Model *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border rounded-lg text-black"
            value={formData.model || ''}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="e.g., 400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Year *</label>
          <input
            type="number"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-2 border rounded-lg text-black"
            value={formData.year || new Date().getFullYear()}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Description</label>
        <textarea
          rows={3}
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of the bike"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Bike Image *</label>
        <div className="space-y-2">
          {formData.image && (
            <Image
              src={formData.image}
              alt="Bike preview"
              width={800}
              height={192}
              className="w-full object-cover border rounded"
            />
          )}
          {onImageUpload && (
            <label className="inline-block px-4 py-2 bg-gray-100 border rounded-lg cursor-pointer hover:bg-gray-200">
              <ImageIcon size={16} className="inline mr-2" />
              <span className="text-black">{uploadingImage ? 'Uploading...' : 'Upload Bike Image'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onImageUpload(e, (url) => setFormData({ ...formData, image: url }))}
                disabled={uploadingImage}
              />
            </label>
          )}
          {!formData.image && (
            <p className="text-sm text-red-600">* Image is required</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Position</label>
        <input
          type="number"
          min="0"
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.position ?? 0}
          onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500 mt-1">Display order (lower numbers appear first)</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive ?? true}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <span className="text-sm text-black">Active (visible on website)</span>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Banner Form
// ---------------------------------------------------------------------------

interface BannerFormProps {
  formData: BannerFormData;
  setFormData: (data: BannerFormData) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage: boolean;
}

export const BannerForm: React.FC<BannerFormProps> = ({
  formData,
  setFormData,
  onImageUpload,
  uploadingImage
}) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Title *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.title || ''}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Subtitle</label>
      <input
        type="text"
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.subtitle || ''}
        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Banner Image</label>
      <div className="space-y-2">
        {formData.image && (
          <Image
            src={formData.image}
            alt="Banner"
            width={800}
            height={192}
            className="w-full object-cover border rounded"
          />
        )}
        <label className="inline-block px-4 py-2 bg-gray-100 border rounded-lg cursor-pointer hover:bg-gray-200">
          <ImageIcon size={16} className="inline mr-2" />
          <span className="text-black">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageUpload(e, (url) => setFormData({ ...formData, image: url }))}
            disabled={uploadingImage}
          />
        </label>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Link URL</label>
      <input
        type="url"
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.link || ''}
        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Position</label>
      <input
        type="number"
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.position ?? 0}
        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.isActive ?? true}
        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
      />
      <span className="text-sm text-black">Active (visible on website)</span>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Coupon Form
// ---------------------------------------------------------------------------

interface CouponFormProps {
  formData: CouponFormData;
  setFormData: (data: CouponFormData) => void;
}

export const CouponForm: React.FC<CouponFormProps> = ({ formData, setFormData }) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Coupon Code *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.code || ''}
        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Discount Type *</label>
      <select
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.discountType || 'PERCENTAGE'}
        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
      >
        <option value="PERCENTAGE">Percentage</option>
        <option value="FIXED">Fixed Amount</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">
        Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
      </label>
      <input
        type="number"
        required
        step="0.01"
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={formData.discountValue || ''}
        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Valid From *</label>
        <input
          type="date"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.validFrom || ''}
          onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Valid Until *</label>
        <input
          type="date"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.validUntil || ''}
          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
        />
      </div>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// MenuItem Form
// ---------------------------------------------------------------------------

interface MenuItemFormProps {
  formData: MenuItemFormData;
  setFormData: (data: MenuItemFormData) => void;
  categories?: Category[];
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage?: boolean;
}

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
  formData,
  setFormData,
  categories = [],
  onImageUpload,
  uploadingImage
}) => {
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({
      ...formData,
      name,
      slug: formData.slug || slug
    });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Display Name *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., RIDING JACKETS"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Slug</label>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg text-black bg-gray-50"
          value={formData.slug || ''}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="Auto-generated from name"
        />
        <p className="text-xs text-gray-500 mt-1">Auto-generated from name or category</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Type *</label>
        <select
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.type || ''}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as MenuItemFormData['type'] })}
        >
          <option value="">Select Type</option>
          <option value="CATEGORY_MENU">Category Menu</option>
          <option value="BRAND_MENU">Brand Menu</option>
          <option value="CUSTOM_MENU">Custom Menu</option>
        </select>
      </div>

      {formData.type === 'CATEGORY_MENU' && categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Link to Category *</label>
          <select
            required
            className="w-full px-4 py-2 border rounded-lg text-black"
            value={formData.categoryId || ''}
            onChange={(e) => {
              const selectedCat = categories.find(c => c.id === e.target.value);
              setFormData({
                ...formData,
                categoryId: e.target.value,
                slug: selectedCat?.slug || formData.slug
              });
            }}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Slug will be set from selected category</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Display Image *</label>
        <div className="space-y-2">
          {formData.image && (
            <Image
              src={formData.image}
              alt="Preview"
              width={800}
              height={192}
              className="w-full object-cover border rounded"
            />
          )}
          {onImageUpload && (
            <label className="inline-block px-4 py-2 bg-gray-100 border rounded-lg cursor-pointer hover:bg-gray-200">
              <ImageIcon size={16} className="inline mr-2" />
              <span className="text-black">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onImageUpload(e, (url) => setFormData({ ...formData, image: url }))}
                disabled={uploadingImage}
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-black">Position in Grid *</label>
        <input
          type="number"
          required
          min="0"
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={formData.position ?? 0}
          onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
        />
        <div className="text-xs text-gray-500 mt-1 space-y-1">
          <p>Position determines where the item appears in the bento grid (0-13+)</p>
          <p className="text-blue-600">Lower numbers appear first</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive ?? true}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <span className="text-sm text-black">Active (visible on website)</span>
      </div>
    </>
  );
};