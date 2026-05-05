// app/api/admin/bulk-import/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { ImportType, Prisma } from "@/app/generated/prisma";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ImportError {
  row: number;
  name: string;
  error: string;
}

interface ExcelRow {
  name?: unknown;
  slug?: unknown;
  price?: unknown;
  salePrice?: unknown;
  stock?: unknown;
  sku?: unknown;
  categoryId?: unknown;
  categorySlug?: unknown;
  bikeId?: unknown;
  bikeSlug?: unknown;
  brandId?: unknown;
  brandSlug?: unknown;
  images?: unknown;
  thumbnail?: unknown;
  isActive?: unknown;
  isFeatured?: unknown;
  metaTitle?: unknown;
  metaDescription?: unknown;
  weight?: unknown;
  dimensions?: unknown;
  material?: unknown;
  color?: unknown;
  size?: unknown;
  hasSize?: unknown;
  sizes?: unknown;
  description?: unknown;
  parentId?: unknown;
  parentSlug?: unknown;
  logo?: unknown;
  position?: unknown;
  showInMenu?: unknown;
  model?: unknown;
  year?: unknown;
  image?: unknown;
  type?: unknown;
  icon?: unknown;
  bgColor?: unknown;
  textColor?: unknown;
  menuColumns?: unknown;
}

type MenuItemType = 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU';

// ─── Helpers ────────────────────────────────────────────────────────────────

function validateRequired(value: unknown, fieldName: string): string {
  if (!value || value === '') throw new Error(`${fieldName} is required`);
  return String(value).trim();
}

function parseNumber(value: unknown, fieldName: string, isRequired = true): number | null {
  if (value === null || value === undefined || value === '') {
    if (isRequired) throw new Error(`${fieldName} is required`);
    return null;
  }
  const num = parseFloat(String(value));
  if (isNaN(num)) throw new Error(`${fieldName} must be a valid number`);
  return num;
}

function parseInteger(value: unknown, fieldName: string, isRequired = true): number | null {
  if (value === null || value === undefined || value === '') {
    if (isRequired) throw new Error(`${fieldName} is required`);
    return null;
  }
  const num = parseInt(String(value));
  if (isNaN(num)) throw new Error(`${fieldName} must be a valid integer`);
  return num;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toUpperCase() === 'TRUE' || value === '1';
  return false;
}

function mapToImportType(type: string): ImportType {
  const mapping: Record<string, ImportType> = {
    products: 'PRODUCTS',
    categories: 'CATEGORIES',
    brands: 'BRANDS',
    bikes: 'BIKES',
    'menu-items': 'MENU_ITEMS',
  };
  const mapped = mapping[type.toLowerCase()];
  if (!mapped) throw new Error(`Invalid import type: ${type}`);
  return mapped;
}

function getString(value: unknown): string {
  return value != null ? String(value).trim() : '';
}

function generateSlug(name: string, existingSlugs: Set<string>): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  existingSlugs.add(slug);
  return slug;
}

function resolveSlug(rawSlug: unknown, name: string, existingSlugs: Set<string>): string {
  const custom = getString(rawSlug);
  if (!custom) return generateSlug(name, existingSlugs);
  if (existingSlugs.has(custom)) return generateSlug(name, existingSlugs);
  existingSlugs.add(custom);
  return custom;
}

function buildLookupMap<T extends { id: string; slug: string }>(
  items: T[]
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
    map.set(item.slug, item);
  }
  return map;
}

const CHUNK_SIZE = 100;

async function batchCreate<T>(
  model: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<{ count: number }> },
  data: T[]
): Promise<void> {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    await model.createMany({ data: data.slice(i, i + CHUNK_SIZE), skipDuplicates: false });
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let failCount = 0;
    const errors: ImportError[] = [];

    const bulkImport = await prisma.bulkImport.create({
      data: {
        type: mapToImportType(type),
        status: 'PROCESSING',
        fileName: file.name,
        fileUrl: '',
        totalRows: data.length,
        createdBy: 'admin',
      },
    });

    const existingSlugs = new Set<string>();

    try {
      switch (type) {

        // ───────────────────────────────────────────────────────────────────
        case 'products': {
          const [existingProducts, allCategories, allBikes, allBrands] = await Promise.all([
            prisma.product.findMany({ select: { slug: true, sku: true } }),
            prisma.category.findMany({ select: { id: true, slug: true } }),
            prisma.bike.findMany({ select: { id: true, slug: true } }),
            prisma.brand.findMany({ select: { id: true, slug: true } }),
          ]);

          existingProducts.forEach((p) => existingSlugs.add(p.slug));
          const existingSkus = new Set(existingProducts.map((p) => p.sku));

          const categoryMap = buildLookupMap(allCategories);
          const bikeMap = buildLookupMap(allBikes);
          const brandMap = buildLookupMap(allBrands);

          const productsToCreate: Prisma.ProductCreateManyInput[] = [];

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const price = parseNumber(row.price, 'Price', true)!;
              const stock = parseInteger(row.stock, 'Stock', true)!;
              const sku = validateRequired(row.sku, 'SKU');

              if (existingSkus.has(sku)) throw new Error(`SKU '${sku}' already exists`);
              existingSkus.add(sku);

              const slug = resolveSlug(row.slug, name, existingSlugs);

              const rawCategoryId = getString(row.categoryId);
              const rawCategorySlug = getString(row.categorySlug);
              if (!rawCategoryId && !rawCategorySlug) {
                throw new Error('Category ID or Category Slug is required');
              }
              const category = categoryMap.get(rawCategoryId) ?? categoryMap.get(rawCategorySlug);
              if (!category) throw new Error(`Category '${rawCategoryId || rawCategorySlug}' not found`);

              const rawBikeId = getString(row.bikeId);
              const rawBikeSlug = getString(row.bikeSlug);
              let resolvedBikeId: string | undefined = undefined;
              if (rawBikeId || rawBikeSlug) {
                const bike = bikeMap.get(rawBikeId) ?? bikeMap.get(rawBikeSlug);
                if (!bike) throw new Error(`Bike '${rawBikeId || rawBikeSlug}' not found`);
                resolvedBikeId = bike.id;
              }

              const rawBrandId = getString(row.brandId);
              const rawBrandSlug = getString(row.brandSlug);
              let resolvedBrandId: string | undefined = undefined;
              if (rawBrandId || rawBrandSlug) {
                const brand = brandMap.get(rawBrandId) ?? brandMap.get(rawBrandSlug);
                if (!brand) throw new Error(`Brand '${rawBrandId || rawBrandSlug}' not found`);
                resolvedBrandId = brand.id;
              }

              const salePrice = parseNumber(row.salePrice, 'Sale Price', false);
              const weight = parseNumber(row.weight, 'Weight', false);

              let images: string[] = [];
              if (row.images) {
                images = String(row.images)
                  .split(',')
                  .map((url) => url.trim())
                  .filter((url) => url.length > 0);
              }

              const thumbnail = getString(row.thumbnail) || images[0] || '';
              const hasSize = parseBoolean(row.hasSize ?? false);
              const sizes =
                hasSize && row.sizes
                  ? String(row.sizes).split(',').map((s) => s.trim()).filter(Boolean)
                  : undefined;

              productsToCreate.push({
                name,
                slug,
                description: getString(row.description),
                price,
                salePrice: salePrice ?? undefined,
                stock,
                sku,
                categoryId: category.id,
                bikeId: resolvedBikeId,
                brandId: resolvedBrandId,
                hasSize,
                sizes,
                images,
                thumbnail,
                isActive: parseBoolean(row.isActive ?? true),
                isFeatured: parseBoolean(row.isFeatured ?? false),
                metaTitle: getString(row.metaTitle) || undefined,
                metaDescription: getString(row.metaDescription) || undefined,
                weight: weight ?? undefined,
                dimensions: getString(row.dimensions) || undefined,
                material: getString(row.material) || undefined,
                color: getString(row.color) || undefined,
                size: getString(row.size) || undefined,
              } satisfies Prisma.ProductCreateManyInput);

              successCount++;
            } catch (error: unknown) {
              failCount++;
              errors.push({
                row: rowNumber,
                name: getString(row.name) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          await batchCreate(prisma.product, productsToCreate);
          break;
        }

        // ───────────────────────────────────────────────────────────────────
        case 'categories': {
          const [existingCategories, allBikes] = await Promise.all([
            prisma.category.findMany({ select: { id: true, slug: true } }),
            prisma.bike.findMany({ select: { id: true, slug: true } }),
          ]);

          existingCategories.forEach((c) => existingSlugs.add(c.slug));
          const categoryMap = buildLookupMap(existingCategories);
          const bikeMap = buildLookupMap(allBikes);

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) ?? 0;
              const menuColumns = parseInteger(row.menuColumns, 'Menu Columns', false) ?? 1;

              const rawParentId = getString(row.parentId);
              const rawParentSlug = getString(row.parentSlug);
              let resolvedParentId: string | undefined = undefined;
              if (rawParentId || rawParentSlug) {
                const parent = categoryMap.get(rawParentId) ?? categoryMap.get(rawParentSlug);
                if (!parent) throw new Error(`Parent Category '${rawParentId || rawParentSlug}' not found`);
                resolvedParentId = parent.id;
              }

              const rawBikeId = getString(row.bikeId);
              const rawBikeSlug = getString(row.bikeSlug);
              let resolvedBikeId: string | undefined = undefined;
              if (rawBikeId || rawBikeSlug) {
                const bike = bikeMap.get(rawBikeId) ?? bikeMap.get(rawBikeSlug);
                if (!bike) throw new Error(`Bike '${rawBikeId || rawBikeSlug}' not found`);
                resolvedBikeId = bike.id;
              }

              const created = await prisma.category.create({
                data: {
                  name,
                  slug,
                  description: getString(row.description) || undefined,
                  image: getString(row.image) || undefined,
                  icon: getString(row.icon) || undefined,
                  position,
                  menuColumns,
                  showInMenu: parseBoolean(row.showInMenu ?? true),
                  isActive: parseBoolean(row.isActive ?? true),
                  parentId: resolvedParentId,
                  bikeId: resolvedBikeId,
                },
              });

              categoryMap.set(created.id, created);
              categoryMap.set(created.slug, created);

              successCount++;
            } catch (error: unknown) {
              failCount++;
              errors.push({
                row: rowNumber,
                name: getString(row.name) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
          break;
        }

        // ───────────────────────────────────────────────────────────────────
        case 'brands': {
          const existingBrands = await prisma.brand.findMany({ select: { slug: true } });
          existingBrands.forEach((b) => existingSlugs.add(b.slug));

          const brandsToCreate: Prisma.BrandCreateManyInput[] = [];

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const logo = validateRequired(row.logo, 'Logo');
              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) ?? 0;

              brandsToCreate.push({
                name,
                slug,
                logo,
                bgColor: getString(row.bgColor) || 'bg-white',
                textColor: getString(row.textColor) || 'text-gray-800',
                description: getString(row.description) || undefined,
                position,
                isActive: parseBoolean(row.isActive ?? true),
              } satisfies Prisma.BrandCreateManyInput);

              successCount++;
            } catch (error: unknown) {
              failCount++;
              errors.push({
                row: rowNumber,
                name: getString(row.name) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          await batchCreate(prisma.brand, brandsToCreate);
          break;
        }

        // ───────────────────────────────────────────────────────────────────
        case 'bikes': {
          const [existingBikes, allBrands] = await Promise.all([
            prisma.bike.findMany({ select: { slug: true } }),
            prisma.brand.findMany({ select: { id: true, slug: true } }),
          ]);

          existingBikes.forEach((b) => existingSlugs.add(b.slug));
          const brandMap = buildLookupMap(allBrands);

          const bikesToCreate: Prisma.BikeCreateManyInput[] = [];

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const model = validateRequired(row.model, 'Model');
              const year = parseInteger(row.year, 'Year', true)!;

              const rawBrandId = getString(row.brandId);
              const rawBrandSlug = getString(row.brandSlug);
              if (!rawBrandId && !rawBrandSlug) throw new Error('Brand ID or Brand Slug is required');

              const brand = brandMap.get(rawBrandId) ?? brandMap.get(rawBrandSlug);
              if (!brand) throw new Error(`Brand '${rawBrandId || rawBrandSlug}' not found`);

              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) ?? 0;

              bikesToCreate.push({
                name,
                slug,
                model,
                year,
                brandId: brand.id,
                image: getString(row.image) || '',
                description: getString(row.description) || undefined,
                position,
                isActive: parseBoolean(row.isActive ?? true),
              } satisfies Prisma.BikeCreateManyInput);

              successCount++;
            } catch (error: unknown) {
              failCount++;
              errors.push({
                row: rowNumber,
                name: getString(row.name) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          await batchCreate(prisma.bike, bikesToCreate);
          break;
        }

        // ───────────────────────────────────────────────────────────────────
        case 'menu-items': {
          const [existingMenuItems, allBrands, allCategories] = await Promise.all([
            prisma.menuItem.findMany({ select: { id: true, slug: true } }),
            prisma.brand.findMany({ select: { id: true, slug: true } }),
            prisma.category.findMany({ select: { id: true, slug: true } }),
          ]);

          existingMenuItems.forEach((m) => existingSlugs.add(m.slug));
          const menuItemMap = buildLookupMap(existingMenuItems);
          const brandMap = buildLookupMap(allBrands);
          const categoryMap = buildLookupMap(allCategories);

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const menuType = validateRequired(row.type, 'Type');

              const validTypes: MenuItemType[] = ['BRAND_MENU', 'CATEGORY_MENU', 'CUSTOM_MENU'];
              if (!validTypes.includes(menuType as MenuItemType)) {
                throw new Error(`Type must be one of: ${validTypes.join(', ')}`);
              }

              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) ?? 0;

              const rawParentId = getString(row.parentId);
              const rawParentSlug = getString(row.parentSlug);
              let resolvedParentId: string | undefined = undefined;
              if (rawParentId || rawParentSlug) {
                const parent = menuItemMap.get(rawParentId) ?? menuItemMap.get(rawParentSlug);
                if (!parent) throw new Error(`Parent Menu '${rawParentId || rawParentSlug}' not found`);
                resolvedParentId = parent.id;
              }

              const rawBrandId = getString(row.brandId);
              const rawBrandSlug = getString(row.brandSlug);
              let resolvedBrandId: string | undefined = undefined;
              if (rawBrandId || rawBrandSlug) {
                const brand = brandMap.get(rawBrandId) ?? brandMap.get(rawBrandSlug);
                if (!brand) throw new Error(`Brand '${rawBrandId || rawBrandSlug}' not found`);
                resolvedBrandId = brand.id;
              }

              const rawCategoryId = getString(row.categoryId);
              const rawCategorySlug = getString(row.categorySlug);
              let resolvedCategoryId: string | undefined = undefined;
              if (rawCategoryId || rawCategorySlug) {
                const category = categoryMap.get(rawCategoryId) ?? categoryMap.get(rawCategorySlug);
                if (!category) throw new Error(`Category '${rawCategoryId || rawCategorySlug}' not found`);
                resolvedCategoryId = category.id;
              }

              const created = await prisma.menuItem.create({
                data: {
                  name,
                  slug,
                  type: menuType as MenuItemType,
                  description: getString(row.description) || undefined,
                  icon: getString(row.icon) || undefined,
                  image: getString(row.image) || undefined,
                  position,
                  isActive: parseBoolean(row.isActive ?? true),
                  parentId: resolvedParentId,
                  brandId: resolvedBrandId,
                  categoryId: resolvedCategoryId,
                },
              });

              menuItemMap.set(created.id, created);
              menuItemMap.set(created.slug, created);

              successCount++;
            } catch (error: unknown) {
              failCount++;
              errors.push({
                row: rowNumber,
                name: getString(row.name) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
          break;
        }

        default:
          throw new Error('Invalid import type');
      }

      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          status: 'COMPLETED',
          successRows: successCount,
          failedRows: failCount,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        totalRows: data.length,
        successRows: successCount,
        failedRows: failCount,
        errors: errors.length > 0 ? errors : null,
      });

    } catch (error: unknown) {
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          status: 'FAILED',
          successRows: successCount,
          failedRows: failCount,
          errors: JSON.stringify([
            { error: error instanceof Error ? error.message : 'Unknown error' },
          ]),
          completedAt: new Date(),
        },
      });
      throw error;
    }

  } catch (error: unknown) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Bulk import failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}