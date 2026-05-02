// admin/modals/Modal.tsx

"use client"
import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { api } from '../api';
import { TabType, ModalType, Category, Brand, Bike } from '../types';
import {
  CategoryForm,
  BrandForm,
  BikeForm,
  BannerForm,
  CouponForm,
  MenuItemForm,
  CategoryFormData,
  BrandFormData,
  BikeFormData,
  BannerFormData,
  CouponFormData,
  MenuItemFormData,
} from './FormComponents';
import { VideoModalForm } from './VideoModalForm';
import { UserModalForm } from './UserModalForm';
import { TestimonialForm } from './TestimonialForm';
import { SizeManager, type SizeEntry } from '../components/SizeManager';
// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type FormData =
  | CategoryFormData
  | BrandFormData
  | BikeFormData
  | BannerFormData
  | CouponFormData
  | MenuItemFormData
  | Record<string, unknown>;

interface ModalItem {
  id?: string;
  images?: string[];
  [key: string]: unknown;
}

interface ModalProps {
  type: ModalType;
  activeTab: TabType;
  item: ModalItem | null;
  onClose: () => void;
  onSave: (endpoint: string, data: Record<string, unknown>, method: 'POST' | 'PUT') => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage: boolean;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export const Modal: React.FC<ModalProps> = ({
  type,
  activeTab,
  item,
  onClose,
  onSave,
  onImageUpload,
  uploadingImage,
  loading
}) => {
  const [formData, setFormData] = useState<FormData>((item as FormData) ?? {});
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
// In Modal — add two dedicated state values
const [hasSize, setHasSize] = useState<boolean>(!!(item as Record<string, unknown>)?.hasSize);
const [sizes, setSizes] = useState<SizeEntry[]>(
  Array.isArray((item as Record<string, unknown>)?.sizes)
    ? ((item as Record<string, unknown>).sizes as SizeEntry[])
    : []
);
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'bikes') {
      loadBrands();
    }
    if (activeTab === 'products' || activeTab === 'categories') {
      loadCategories();
    }
    if (activeTab === 'products') {
      loadBikes();
    }
  }, [activeTab]);

  const loadBrands = async () => {
    try {
      const data = await api.fetchData<Brand[]>('/brands');
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.fetchData<Category[]>('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBikes = async () => {
    try {
      const data = await api.fetchData<Bike[]>('/bikes');
      setBikes(data);
    } catch (error) {
      console.error('Failed to load bikes:', error);
    }
  };

  const emptyToNull = (value: unknown): unknown => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const parseIntField = (value: unknown): number | null => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? null : parsed;
  };

  const prepareBikeData = (data: BikeFormData): Record<string, unknown> => {
    return {
      name: data.name,
      slug: data.slug,
      brandId: data.brandId,
      model: data.model,
      year: parseIntField(data.year),
      description: emptyToNull(data.description),
      image: emptyToNull(data.image),
      isActive: data.isActive ?? true,
      position: parseIntField(data.position) ?? 0
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let endpoint = `/${activeTab}`;
    const method: 'POST' | 'PUT' = type === 'create' ? 'POST' : 'PUT';

    let dataToSend: Record<string, unknown>;

    if (activeTab === 'bikes') {
      dataToSend = prepareBikeData(formData as BikeFormData);
} else if (activeTab === 'products') {
  const productData = formData as Record<string, unknown>;
  dataToSend = {
    ...productData,
    images,
    hasSize,
    sizes: hasSize ? sizes : null,
  };
  if (images.length > 0) {
    dataToSend.thumbnail = images[0];
  }
}else {
      dataToSend = { ...(formData as Record<string, unknown>) };
    }

    if (type === 'edit' && item?.id) {
      endpoint = `${endpoint}/${item.id}`;
    }

    await onSave(endpoint, dataToSend, method);
  };

  const addImage = (url: string) => {
    setImages(prev => [...prev, url]);
  };

  const addMultipleImages = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Special handling for users
  if (activeTab === 'users') {
    return (
      <UserModalForm
        type={type}
        item={item}
        onClose={onClose}
        onSave={onSave}
        loading={loading}
      />
    );
  }

  // Special handling for testimonials
  if (activeTab === 'testimonials') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-black">
              {type === 'create' ? 'Add New' : 'Edit'} Testimonial
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <TestimonialForm
              item={item}
              onSave={onSave}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
              loading={loading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-black">
            {type === 'create' ? 'Add New' : 'Edit'} {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'products' && (
  <ProductForm
    formData={formData as Record<string, unknown>}
    setFormData={setFormData}
    hasSize={hasSize}
    setHasSize={setHasSize}
    sizes={sizes}
    setSizes={setSizes}
    images={images}
    addImage={addImage}
    addMultipleImages={addMultipleImages}
    removeImage={removeImage}
    categories={categories}
    bikes={bikes}
    onImageUpload={onImageUpload}
    uploadingImage={uploadingImage}
  />
)}

          {activeTab === 'categories' && (
            <CategoryForm
              formData={formData as CategoryFormData}
              setFormData={setFormData}
              categories={categories}
              currentItemId={item?.id}
            />
          )}

          {activeTab === 'brands' && (
            <BrandForm
              formData={formData as BrandFormData}
              setFormData={setFormData}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
            />
          )}

          {activeTab === 'bikes' && (
            <BikeForm
              formData={formData as BikeFormData}
              setFormData={setFormData}
              brands={brands}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
            />
          )}

          {activeTab === 'banners' && (
            <BannerForm
              formData={formData as BannerFormData}
              setFormData={setFormData}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponForm
              formData={formData as CouponFormData}
              setFormData={setFormData}
            />
          )}

          {activeTab === 'menu-items' && (
            <MenuItemForm
              formData={formData as MenuItemFormData}
              setFormData={setFormData}
              categories={categories}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
            />
          )}

          {activeTab === 'videos' && (
            <VideoModalForm
              video={item as Parameters<typeof VideoModalForm>[0]['video']}
              onSave={(data) => {
                const endpoint = '/api/admin/videos';
                const method: 'POST' | 'PUT' = type === 'edit' ? 'PUT' : 'POST';
                const payload = type === 'edit' ? { ...data, id: item?.id } : data;
                onSave(endpoint, payload as Record<string, unknown>, method);
              }}
              loading={loading}
            />
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="text-white">Saving...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span className="text-white">{type === 'create' ? 'Create' : 'Update'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product Form (internal to Modal)
// ---------------------------------------------------------------------------

interface ProductFormProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  hasSize: boolean;
  setHasSize: (val: boolean) => void;
  sizes: SizeEntry[];
  setSizes: (sizes: SizeEntry[]) => void;
  images: string[];
  addImage: (url: string) => void;
  addMultipleImages: (urls: string[]) => void;
  removeImage: (index: number) => void;
  categories: Category[];
  bikes: Bike[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  uploadingImage: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  hasSize,
  setHasSize,
  sizes,
  setSizes,
  images,
  addMultipleImages,
  removeImage,
  categories,
  bikes,
  onImageUpload,
  uploadingImage,
}) => (
  <>
    <div>
      <label className="block text-sm font-medium mb-2 text-black">Product Name *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={(formData.name as string) || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-black">SKU *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={(formData.sku as string) || ''}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Price (₹) *</label>
        <input
          type="number"
          required
          step="0.01"
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={(formData.price as string | number) || ''}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Sale Price (₹)</label>
        <input
          type="number"
          step="0.01"
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={(formData.salePrice as string | number) || ''}
          onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-black">Stock *</label>
        <input
          type="number"
          required
          className="w-full px-4 py-2 border rounded-lg text-black"
          value={(formData.stock as string | number) || ''}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2 text-black">Description *</label>
      <textarea
        required
        rows={4}
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={(formData.description as string) || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2 text-black">Category *</label>
      <select
        required
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={(formData.categoryId as string) || ''}
        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    </div>

    <div>  {/* ← closes correctly */}
      <label className="block text-sm font-medium mb-2 text-black">Bike (Optional)</label>
      <select
        className="w-full px-4 py-2 border rounded-lg text-black"
        value={(formData.bikeId as string) || ''}
        onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
      >
        <option value="">General Product</option>
        {bikes.map(bike => (
          <option key={bike.id} value={bike.id}>{bike.name}</option>
        ))}
      </select>
    </div>  {/* ← this was missing — SizeManager was nested inside this div */}

    <div>
      <label className="block text-sm font-medium mb-2 text-black">Size Variants</label>
      <SizeManager
        hasSize={hasSize}
        sizes={sizes}
        onToggle={(val) => {
          setHasSize(val);
          if (!val) setSizes([]);
        }}
        onChange={setSizes}
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2 text-black">
        Product Images
        {images.length > 0 && (
          <span className="ml-2 text-xs text-gray-500 font-normal">
            {images.length} image{images.length > 1 ? 's' : ''} — first is thumbnail
          </span>
        )}
      </label>
      <div className="space-y-3">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 border rounded group">
                <Image
                  src={img}
                  alt=""
                  width={96}
                  height={96}
                  className="w-full h-full object-cover rounded"
                />
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[10px] bg-blue-500 rounded-b py-0.5">
                    Thumbnail
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded-lg cursor-pointer hover:bg-gray-200 ${
            uploadingImage ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <ImageIcon size={16} />
          <span className="text-black">
            {uploadingImage ? 'Uploading...' : 'Upload Images'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploadingImage}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (!files.length) return;
              const urls: string[] = [];
              let completed = 0;
              files.forEach((file) => {
                const syntheticEvent = {
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                onImageUpload(syntheticEvent, (url) => {
                  urls.push(url);
                  completed++;
                  if (completed === files.length) addMultipleImages(urls);
                });
              });
              e.target.value = '';
            }}
          />
        </label>
        <p className="text-xs text-gray-500">
          Select multiple images at once. The first image will be used as the thumbnail.
        </p>
      </div>
    </div>

    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={(formData.isActive as boolean) ?? true}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <span className="text-sm text-black">Active</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={(formData.isFeatured as boolean) ?? false}
          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
        />
        <span className="text-sm text-black">Featured</span>
      </label>
    </div>
  </>
);