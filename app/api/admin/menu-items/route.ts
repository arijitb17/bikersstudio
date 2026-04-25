// app/api/admin/menu-items/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true } }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Menu items fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('=== MENU ITEM CREATE DEBUG ===');
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    
    // Generate slug if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    console.log('Generated slug:', slug);
    
    const menuItem = await prisma.menuItem.create({
      data: {
        name: body.name,
        slug: slug,
        type: body.type,
        description: body.description || null,
        icon: body.icon || null,
        image: body.image || null,
        isActive: body.isActive ?? true,
        position: parseInt(body.position) || 0,
        parentId: body.parentId || null,
        brandId: body.brandId || null,
        categoryId: body.categoryId || null
      },
      include: {
        parent: { select: { name: true } },
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } }
      }
    });

    console.log('Created menu item:', JSON.stringify(menuItem, null, 2));
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error('=== MENU ITEM CREATE ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'any error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({ 
      error: 'Failed to create menu item', 
      details: error instanceof Error ? error.message : 'any error' 
    }, { status: 500 });
  }
}
