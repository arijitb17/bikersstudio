// app/api/menu-items/categories-display/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        type: 'CATEGORY_MENU',
        isActive: true,
      },
      include: {
        category: {
          select: {
            slug: true,
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    const categories = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image || '/categories/default.png',
      slug: item.category?.slug || item.slug,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching category menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
