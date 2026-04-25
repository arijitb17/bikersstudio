// app/api/admin/bulk-import/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { ImportType } from "@/app/generated/prisma";

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
  bikeId?: unknown;
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
  description?: unknown;
  parentId?: unknown;
  logo?: unknown;
  position?: unknown;
  showInMenu?: unknown;
  model?: unknown;
  year?: unknown;
  brandId?: unknown;
  image?: unknown;
  type?: unknown;
}

type MenuItemType = 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU';

function validateRequired(value: unknown, fieldName: string): string {
  if (!value || value === '') {
    throw new Error(`${fieldName} is required`);
  }
  return String(value).trim();
}

function parseNumber(value: unknown, fieldName: string, isRequired = true): number | null {
  if (!value || value === '') {
    if (isRequired) throw new Error(`${fieldName} is required`);
    return null;
  }
  const num = parseFloat(String(value));
  if (isNaN(num)) throw new Error(`${fieldName} must be a valid number`);
  return num;
}

function parseInteger(value: unknown, fieldName: string, isRequired = true): number | null {
  if (!value || value === '') {
    if (isRequired) throw new Error(`${fieldName} is required`);
    return null;
  }
  const num = parseInt(String(value));
  if (isNaN(num)) throw new Error(`${fieldName} must be a valid integer`);
  return num;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toUpperCase() === 'TRUE' || value === '1';
  }
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

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
        case 'products': {
          const existingProducts = await prisma.product.findMany({
            select: { slug: true, sku: true },
          });
          existingProducts.forEach((p) => existingSlugs.add(p.slug));
          const existingSkus = new Set(existingProducts.map((p) => p.sku));

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const price = parseNumber(row.price, 'Price', true)!;
              const stock = parseInteger(row.stock, 'Stock', true)!;
              const categoryId = validateRequired(row.categoryId, 'Category ID');

              const sku = validateRequired(row.sku, 'SKU');
              if (existingSkus.has(sku)) throw new Error(`SKU '${sku}' already exists`);
              existingSkus.add(sku);

              const slug = resolveSlug(row.slug, name, existingSlugs);

              // Resolve category by id or slug
              const category = await prisma.category.findFirst({
                where: {
                  OR: [{ id: categoryId }, { slug: categoryId }],
                },
              });
              if (!category) throw new Error(`Category '${categoryId}' not found`);

              // Resolve bike by id or slug (optional)
              const rawBikeId = getString(row.bikeId) || null;
              let resolvedBikeId: string | null = null;
              if (rawBikeId) {
                const bike = await prisma.bike.findFirst({
                  where: {
                    OR: [{ id: rawBikeId }, { slug: rawBikeId }],
                  },
                });
                if (!bike) throw new Error(`Bike '${rawBikeId}' not found`);
                resolvedBikeId = bike.id;
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

              await prisma.product.create({
                data: {
                  name,
                  slug,
                  description: getString(row.description),
                  price,
                  salePrice,
                  stock,
                  sku,
                  categoryId: category.id,
                  bikeId: resolvedBikeId,
                  images,
                  thumbnail,
                  isActive: parseBoolean(row.isActive ?? true),
                  isFeatured: parseBoolean(row.isFeatured ?? false),
                  metaTitle: getString(row.metaTitle) || null,
                  metaDescription: getString(row.metaDescription) || null,
                  weight,
                  dimensions: getString(row.dimensions) || null,
                  material: getString(row.material) || null,
                  color: getString(row.color) || null,
                  size: getString(row.size) || null,
                },
              });

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

        case 'categories': {
          const existingCategories = await prisma.category.findMany({ select: { slug: true } });
          existingCategories.forEach((c) => existingSlugs.add(c.slug));

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) || 0;

              const rawParentId = getString(row.parentId) || null;
              let resolvedParentId: string | null = null;
              if (rawParentId) {
                const parent = await prisma.category.findFirst({
                  where: {
                    OR: [{ id: rawParentId }, { slug: rawParentId }],
                  },
                });
                if (!parent) throw new Error(`Parent Category '${rawParentId}' not found`);
                resolvedParentId = parent.id;
              }

              await prisma.category.create({
                data: {
                  name,
                  slug,
                  description: getString(row.description) || null,
                  position,
                  showInMenu: parseBoolean(row.showInMenu ?? true),
                  isActive: parseBoolean(row.isActive ?? true),
                  parentId: resolvedParentId,
                },
              });

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

        case 'brands': {
          const existingBrands = await prisma.brand.findMany({ select: { slug: true } });
          existingBrands.forEach((b) => existingSlugs.add(b.slug));

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const logo = validateRequired(row.logo, 'Logo');
              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) || 0;

              await prisma.brand.create({
                data: {
                  name,
                  slug,
                  logo,
                  description: getString(row.description) || null,
                  position,
                  isActive: parseBoolean(row.isActive ?? true),
                },
              });

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

        case 'bikes': {
          const existingBikes = await prisma.bike.findMany({ select: { slug: true } });
          existingBikes.forEach((b) => existingSlugs.add(b.slug));

          for (let i = 0; i < data.length; i++) {
            const row = data[i] as ExcelRow;
            const rowNumber = i + 2;

            try {
              const name = validateRequired(row.name, 'Name');
              const model = validateRequired(row.model, 'Model');
              const year = parseInteger(row.year, 'Year', true)!;
              const rawBrandId = validateRequired(row.brandId, 'Brand ID');
              const image = validateRequired(row.image, 'Image');

              // Resolve brand by id or slug
              const brand = await prisma.brand.findFirst({
                where: {
                  OR: [{ id: rawBrandId }, { slug: rawBrandId }],
                },
              });
              if (!brand) throw new Error(`Brand '${rawBrandId}' not found`);

              const slug = resolveSlug(row.slug, name, existingSlugs);
              const position = parseInteger(row.position, 'Position', false) || 0;

              await prisma.bike.create({
                data: {
                  name,
                  slug,
                  model,
                  year,
                  brandId: brand.id,
                  image,
                  description: getString(row.description) || null,
                  position,
                  isActive: parseBoolean(row.isActive ?? true),
                },
              });

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

        case 'menu-items': {
          const existingMenuItems = await prisma.menuItem.findMany({ select: { slug: true } });
          existingMenuItems.forEach((m) => existingSlugs.add(m.slug));

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
              const position = parseInteger(row.position, 'Position', false) || 0;

              const rawParentId = getString(row.parentId) || null;
              let resolvedParentId: string | null = null;
              if (rawParentId) {
                const parent = await prisma.menuItem.findFirst({
                  where: {
                    OR: [{ id: rawParentId }, { slug: rawParentId }],
                  },
                });
                if (!parent) throw new Error(`Parent Menu '${rawParentId}' not found`);
                resolvedParentId = parent.id;
              }

              const rawBrandId = getString(row.brandId) || null;
              let resolvedBrandId: string | null = null;
              if (rawBrandId) {
                const brand = await prisma.brand.findFirst({
                  where: {
                    OR: [{ id: rawBrandId }, { slug: rawBrandId }],
                  },
                });
                if (!brand) throw new Error(`Brand '${rawBrandId}' not found`);
                resolvedBrandId = brand.id;
              }

              const rawCategoryId = getString(row.categoryId) || null;
              let resolvedCategoryId: string | null = null;
              if (rawCategoryId) {
                const category = await prisma.category.findFirst({
                  where: {
                    OR: [{ id: rawCategoryId }, { slug: rawCategoryId }],
                  },
                });
                if (!category) throw new Error(`Category '${rawCategoryId}' not found`);
                resolvedCategoryId = category.id;
              }

              await prisma.menuItem.create({
                data: {
                  name,
                  slug,
                  type: menuType as MenuItemType,
                  description: getString(row.description) || null,
                  position,
                  isActive: parseBoolean(row.isActive ?? true),
                  parentId: resolvedParentId,
                  brandId: resolvedBrandId,
                  categoryId: resolvedCategoryId,
                },
              });

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
          errors: JSON.stringify([{ error: error instanceof Error ? error.message : 'Unknown error' }]),
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