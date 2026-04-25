// app/api/categories/[slug]/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // IMPORTANT: Await params in Next.js 15+
    const { slug } = await context.params;

    console.log('Fetching products for category slug:', slug);

    // Find the category by slug
    const category = await prisma.category.findUnique({
      where: { slug },
    });
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get products for this category
    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        thumbnail: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        bike: {
          select: {
            name: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}