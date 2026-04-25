// app/api/admin/templates/[type]/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
type TemplateRow = Record<string, string | number | boolean>;
type Instructions = Record<string, string>;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    let sampleData: TemplateRow[] = [];
    let instructions: Instructions = {};

    switch (type) {
      case 'products':
        sampleData = [
          {
            name: 'Sample Product Name',
            slug: 'sample-product-name (leave blank for auto-generation)',
            description: 'Detailed product description here',
            price: 1000.00,
            salePrice: 900.00,
            stock: 50,
            sku: 'SKU-001 (must be unique)',
            categoryId: 'paste-actual-category-id-here',
            bikeId: 'paste-bike-id-here-or-leave-blank',
            images: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
            thumbnail: 'https://example.com/thumbnail.jpg (or leave blank to use first image)',
            isActive: 'TRUE',
            isFeatured: 'FALSE',
            metaTitle: 'SEO Meta Title',
            metaDescription: 'SEO Meta Description',
            weight: 1.5,
            dimensions: '10x20x5 cm',
            material: 'Aluminum',
            color: 'Black',
            size: 'Medium'
          },
          {
            name: 'Another Product',
            slug: '',
            description: 'Another product description',
            price: 2500.00,
            salePrice: '',
            stock: 100,
            sku: 'SKU-002',
            categoryId: 'paste-actual-category-id-here',
            bikeId: '',
            images: '',
            thumbnail: '',
            isActive: 'TRUE',
            isFeatured: 'TRUE',
            metaTitle: '',
            metaDescription: '',
            weight: '',
            dimensions: '',
            material: '',
            color: '',
            size: ''
          }
        ];
        
        instructions = {
          'INSTRUCTIONS': 'Read this carefully before filling the template',
          'Required Fields': 'name, price, stock, sku, categoryId',
          'Optional Fields': 'All other fields can be left blank',
          'slug': 'Auto-generated from name if left blank. Must be unique.',
          'price': 'Product price in decimal format (e.g., 1000.00)',
          'salePrice': 'Discounted price (optional). Leave blank if no sale.',
          'stock': 'Integer number (e.g., 50)',
          'sku': 'Must be unique. Use format like SKU-001, SKU-002',
          'categoryId': 'Get from Categories page. Copy exact ID.',
          'bikeId': 'Optional. Get from Bikes page if product is bike-specific.',
          'images': 'Comma-separated URLs (e.g., url1,url2,url3)',
          'thumbnail': 'Single URL. Auto-uses first image if blank.',
          'isActive': 'TRUE or FALSE (default: TRUE)',
          'isFeatured': 'TRUE or FALSE (default: FALSE)',
          'Boolean Fields': 'Use TRUE or FALSE (case insensitive)'
        };
        break;

      case 'categories':
        sampleData = [
          {
            name: 'Sample Category',
            slug: 'sample-category (leave blank for auto-generation)',
            description: 'Category description',
            position: 1,
            showInMenu: 'TRUE',
            isActive: 'TRUE',
            parentId: 'parent-category-id-or-leave-blank'
          },
          {
            name: 'Another Category',
            slug: '',
            description: '',
            position: 2,
            showInMenu: 'TRUE',
            isActive: 'TRUE',
            parentId: ''
          }
        ];
        
        instructions = {
          'INSTRUCTIONS': 'Read this carefully',
          'Required Fields': 'name',
          'slug': 'Auto-generated if left blank',
          'position': 'Integer for ordering (default: 0)',
          'parentId': 'For subcategories, paste parent category ID'
        };
        break;

      case 'brands':
        sampleData = [
          {
            name: 'Sample Brand',
            slug: 'sample-brand (leave blank for auto-generation)',
            logo: 'https://cloudinary-url.com/logo.png',
            description: 'Brand description',
            position: 1,
            isActive: 'TRUE'
          },
          {
            name: 'Another Brand',
            slug: '',
            logo: 'https://example.com/logo2.png',
            description: '',
            position: 2,
            isActive: 'TRUE'
          }
        ];
        
        instructions = {
          'INSTRUCTIONS': 'Read this carefully',
          'Required Fields': 'name, logo',
          'slug': 'Auto-generated if left blank',
          'logo': 'URL to brand logo image',
          'position': 'Integer for ordering (default: 0)'
        };
        break;

      case 'bikes':
        sampleData = [
          {
            name: 'Sample Bike Model',
            slug: 'sample-bike-model (leave blank for auto-generation)',
            model: 'Model Name',
            year: 2024,
            brandId: 'paste-actual-brand-id-here',
            image: 'https://cloudinary-url.com/bike.jpg',
            description: 'Bike description',
            position: 1,
            isActive: 'TRUE'
          },
          {
            name: 'Another Bike',
            slug: '',
            model: 'Another Model',
            year: 2025,
            brandId: 'paste-actual-brand-id-here',
            image: 'https://example.com/bike2.jpg',
            description: '',
            position: 2,
            isActive: 'TRUE'
          }
        ];
        
        instructions = {
          'INSTRUCTIONS': 'Read this carefully',
          'Required Fields': 'name, model, year, brandId, image',
          'slug': 'Auto-generated if left blank',
          'year': 'Integer (e.g., 2024)',
          'brandId': 'Get from Brands page. Copy exact ID.',
          'position': 'Integer for ordering (default: 0)'
        };
        break;

      case 'menu-items':
        sampleData = [
          {
            name: 'Sample Menu Item',
            slug: 'sample-menu-item (leave blank for auto-generation)',
            type: 'CATEGORY_MENU',
            description: 'Menu description',
            position: 1,
            isActive: 'TRUE',
            parentId: 'parent-menu-id-or-leave-blank',
            brandId: 'brand-id-or-leave-blank',
            categoryId: 'category-id-or-leave-blank'
          },
          {
            name: 'Another Menu Item',
            slug: '',
            type: 'BRAND_MENU',
            description: '',
            position: 2,
            isActive: 'TRUE',
            parentId: '',
            brandId: '',
            categoryId: ''
          }
        ];
        
        instructions = {
          'INSTRUCTIONS': 'Read this carefully',
          'Required Fields': 'name, type',
          'type': 'Must be: BRAND_MENU, CATEGORY_MENU, or CUSTOM_MENU',
          'slug': 'Auto-generated if left blank',
          'parentId': 'For sub-menu items',
          'brandId': 'For BRAND_MENU type items',
          'categoryId': 'For CATEGORY_MENU type items'
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    // Create workbook with instructions and data
    const workbook = XLSX.utils.book_new();
    
    // Add instructions sheet
    const instructionsWS = XLSX.utils.json_to_sheet([instructions]);
    XLSX.utils.book_append_sheet(workbook, instructionsWS, 'Instructions');
    
    // Add data sheet
    const dataWS = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const maxWidth = 50;
    const colWidths = Object.keys(sampleData[0]).map(key => ({
      wch: Math.min(key.length + 10, maxWidth)
    }));
    dataWS['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, dataWS, type);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_template.xlsx"`
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}