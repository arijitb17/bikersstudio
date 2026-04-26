// admin/views/index.tsx

"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '../components/DataTable';
import { api } from '../api';
import {
  Product,
  Category,
  Brand,
  Bike,
  MenuEntity,
  Banner,
  Coupon
} from '../types';
import { useSearchParams } from 'next/navigation';

interface ViewProps<T> {
  onEdit?: (item: T) => void;
  onDelete?: (id: string, name: string) => void;
  refreshTrigger: number;
}

// ─── Helper: unwrap { data: T[] } | T[] ───────────────────────────────────────
function unwrapArray<T>(response: { data?: T[] } | T[]): T[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray((response as { data?: T[] }).data)) {
    return (response as { data: T[] }).data;
  }
  return [];
}

// ─── Products View ────────────────────────────────────────────────────────────
export const ProductsView: React.FC<ViewProps<Product>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const searchParams = useSearchParams();
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const search   = searchParams.get('search') || '';
  const pageSize = 10;

  const [products, setProducts] = useState<Product[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(pageSize),
        ...(search ? { search } : {}),
      });
      const response = await api.fetchData<{ data: Product[]; total: number }>(`/products?${params}`);
      setProducts(response.data ?? []);
      setTotal(response.total ?? 0);
    } catch (err: unknown) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadProducts(); }, [loadProducts]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading products…</div>;
  if (error)   return <div className="text-center py-12 text-red-500">{error}</div>;

  return (
    <DataTable
      data={products}
      total={total}
      page={page}
      pageSize={pageSize}
      columns={[
        { key: 'name',       label: 'Product Name' },
        { key: 'sku',        label: 'SKU' },
        { key: 'price',      label: 'Price',    render: (v) => `₹${v}` },
        { key: 'stock',      label: 'Stock' },
        { key: 'categoryId', label: 'Category', render: (_v, row) => row.category?.name ?? 'N/A' },
        { key: 'isActive',   label: 'Status',   render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Categories View ──────────────────────────────────────────────────────────
export const CategoriesView: React.FC<ViewProps<Category>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: Category[] } | Category[]>('/categories');
      setCategories(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCategories(); }, [loadCategories]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading categories…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadCategories} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={categories}
      columns={[
        { key: 'name',       label: 'Category Name' },
        { key: 'slug',       label: 'Slug' },
        { key: 'position',   label: 'Position' },
        { key: 'showInMenu', label: 'In Menu', render: (v) => (v ? '✓' : '✗') },
        { key: 'isActive',   label: 'Status',  render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Brands View ──────────────────────────────────────────────────────────────
export const BrandsView: React.FC<ViewProps<Brand>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: Brand[] } | Brand[]>('/brands');
      setBrands(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load brands:', err);
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBrands(); }, [loadBrands]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading brands…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadBrands} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={brands}
      columns={[
        { key: 'name',     label: 'Brand Name' },
        { key: 'slug',     label: 'Slug' },
        { key: 'position', label: 'Position' },
        { key: 'isActive', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Bikes View ───────────────────────────────────────────────────────────────
export const BikesView: React.FC<ViewProps<Bike>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBikes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: Bike[] } | Bike[]>('/bikes');
      setBikes(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load bikes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bikes');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBikes(); }, [loadBikes]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading bikes…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadBikes} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={bikes}
      columns={[
        { key: 'name',     label: 'Bike Name' },
        { key: 'brandId',  label: 'Brand',  render: (_v, row) => row.brand?.name ?? 'N/A' },
        { key: 'model',    label: 'Model' },
        { key: 'year',     label: 'Year' },
        { key: 'isActive', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Menu Items View ──────────────────────────────────────────────────────────
export const MenuItemsView: React.FC<ViewProps<MenuEntity>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [menuItems, setMenuItems] = useState<MenuEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: MenuEntity[] } | MenuEntity[]>('/menu-items');
      setMenuItems(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load menu items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMenuItems(); }, [loadMenuItems]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading menu items…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadMenuItems} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={menuItems}
      columns={[
        { key: 'name',     label: 'Menu Name' },
        { key: 'type',     label: 'Type' },
        { key: 'position', label: 'Position' },
        { key: 'isActive', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Orders View ──────────────────────────────────────────────────────────────
export { OrdersView } from './OrdersView';

// ─── Banners View ─────────────────────────────────────────────────────────────
export const BannersView: React.FC<ViewProps<Banner>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: Banner[] } | Banner[]>('/banners');
      setBanners(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load banners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBanners(); }, [loadBanners]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading banners…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadBanners} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={banners}
      columns={[
        { key: 'title',    label: 'Title' },
        { key: 'position', label: 'Position' },
        { key: 'isActive', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// ─── Coupons View ─────────────────────────────────────────────────────────────
export const CouponsView: React.FC<ViewProps<Coupon>> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.fetchData<{ data?: Coupon[] } | Coupon[]>('/coupons');
      setCoupons(unwrapArray(response));
    } catch (err: unknown) {
      console.error('Failed to load coupons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading coupons…</div>;
  if (error)   return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-3">{error}</p>
      <button onClick={loadCoupons} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <DataTable
      data={coupons}
      columns={[
        { key: 'code',          label: 'Code' },
        { key: 'discountType',  label: 'Type' },
        { key: 'discountValue', label: 'Value', render: (v, row) =>
          row.discountType === 'PERCENTAGE' ? `${v}%` : `₹${v}`
        },
        { key: 'isActive', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded text-xs ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

export { ImagesView }   from './ImagesView';
export { ReviewsView }  from './ReviewsView';
export { MenuJsonView } from './MenuJsonView';
export { UsersView }    from './UsersView';
export { VideosView }   from './VideosView';