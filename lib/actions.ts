'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, PaymentMethod } from '@/app/generated/prisma/client';

// -----------------
// BRANDS & BIKES
// -----------------

export async function getAllBrands() {
  return await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getBrandsForShopByBikes() {
  return await prisma.brand.findMany({
    where: {
      isActive: true,
      bikes: {
        some: {
          isActive: true,
        },
      },
    },
    orderBy: { name: 'asc' },
    select: {
      name: true,
      slug: true,
      logo: true,
      bgColor: true,
      textColor: true,
    },
  });
}

export async function getBrandWithBikes(slug: string) {
  return await prisma.brand.findFirst({
    where: { slug, isActive: true },
    include: {
      bikes: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  });
}

type BikeWithProducts = Prisma.BikeGetPayload<{
  include: {
    brand: true;
    products: {
      include: {
        category: true;
        brand: true; // add this
        bike: {
          include: {
            brand: true;
          };
        };
      };
    };
  };
}>;

type ProductWithRelations = BikeWithProducts['products'][number];

export async function getBikeWithProducts(slug: string) {
  const bike = await prisma.bike.findUnique({
    where: { slug, isActive: true },
    include: {
      brand: true,
      products: {
        where: { isActive: true },
        include: {
          category: true,
          brand: true, // add this
          bike: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!bike) return null;

  return {
    ...bike,
    products: bike.products.map((p: ProductWithRelations) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      thumbnail: p.thumbnail,
      images: p.images,
      stock: p.stock,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      weight: p.weight ? Number(p.weight) : null,
      color: p.color,
      size: p.size,
      material: p.material,
      description: p.description,

      category: {
        name: p.category.name,
      },

      brand: p.brand // add this
        ? {
            name: p.brand.name,
          }
        : null,

      bike: p.bike
        ? {
            name: p.bike.name,
            brand: {
              name: p.bike.brand.name,
            },
          }
        : null,
    })),
  };
}

// -----------------
// CATEGORIES
// -----------------

export async function getAllCategories() {
  return await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryWithProducts(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      products: {
  where: { isActive: true },
  include: {
    category: true,
    brand: true,
    bike: { include: { brand: true } },
  },
  orderBy: { name: 'asc' },
},
      children: {
        where: { isActive: true },
        include: {
          products: {
  where: { isActive: true },
  include: {
    category: true,
    brand: true,
    bike: { include: { brand: true } },
  },
},
        },
      },
      bike: { include: { brand: true } },
    },
  });

  if (!category) return null;

  type CategoryWithProducts = NonNullable<typeof category>;

  const allProducts = [
    ...category.products,
    ...category.children.flatMap(
      (child: CategoryWithProducts['children'][number]) => child.products
    ),
  ];

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    isActive: category.isActive,
    products: allProducts.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  thumbnail: p.thumbnail,
  stock: p.stock,
  price: Number(p.price),
  salePrice: p.salePrice ? Number(p.salePrice) : null,

  brand: p.brand
    ? {
        name: p.brand.name,
      }
    : null,

  category: {
    name: p.category.name,
  },

  bike: p.bike
    ? {
        name: p.bike.name,
        brand: {
          name: p.bike.brand.name,
        },
      }
    : null,
})),
  };
}

// -----------------
// PRODUCTS (UNIVERSAL)
// -----------------

export type ProductBySlug = Prisma.ProductGetPayload<{
  include: {
    category: {
      select: { id: true; name: true; slug: true };
    };
    brand: {
      select: { id: true; name: true; slug: true; logo: true };
    };
    bike: {
      include: {
        brand: {
          select: { id: true; name: true; slug: true; logo: true };
        };
      };
    };
    reviews: {
      where: { isApproved: true };        // ← add this
      orderBy: { createdAt: 'desc' };     // ← add this
      include: {
        user: {
          select: { name: true; email: true };
        };
      };
    };
  };
}> | null;

export async function getProductBySlug(slug: string): Promise<ProductBySlug> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        // ✅ Direct brand relation (for helmet/standalone products with brandId but no bikeId)
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },

        // ✅ Bike relation with its own brand (for bike-specific parts/accessories)
        bike: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },

        reviews: {
          where: {
            isApproved: true,
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// ✅ FIX: Added `brand` to the include so the inferred return type includes
//    brand?.name — without this, TypeScript collapses brand to `never` and
//    any downstream access like related.brand?.name errors with
//    "Property 'name' does not exist on type 'never'".
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId,
      id: { not: productId },
    },
    include: {
      category: true,
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      bike: {
        include: { brand: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
  }));
}

export async function getFeaturedProducts(limit = 8) {
  return await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: {
      category: true,
      bike: {
        include: { brand: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

// -----------------
// CART
// -----------------

export async function getCart(userId: string) {
  return await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          bike: { include: { brand: true } },
        },
      },
    },
  });
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity = 1
) {
  return await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: { userId, productId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

export async function updateCartQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  if (quantity <= 0) {
    return await prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }
  return await prisma.cartItem.update({
    where: { userId_productId: { userId, productId } },
    data: { quantity },
  });
}

export async function removeFromCart(userId: string, productId: string) {
  return await prisma.cartItem.delete({
    where: { userId_productId: { userId, productId } },
  });
}

export async function clearCart(userId: string) {
  return await prisma.cartItem.deleteMany({
    where: { userId },
  });
}

// -----------------
// ORDERS
// -----------------

interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;        // ← add
  product: {
    price: number;
    salePrice: number | null;
  };
}

export async function createOrder(data: {
  userId: string;
  addressId: string;
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
}) {
  const orderNumber = `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 11)
    .toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: data.userId,
      addressId: data.addressId,
      paymentMethod: data.paymentMethod,
      subtotal: data.subtotal,
      tax: data.tax,
      shippingCost: data.shippingCost,
      total: data.total,
      items: {
  create: data.cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.product.salePrice || item.product.price,
    subtotal: (item.product.salePrice || item.product.price) * item.quantity,
    selectedSize: item.selectedSize ?? null,   // ← add
  })),
},
    },
    include: {
      items: {
        include: { product: true },
      },
      address: true,
    },
  });

  await clearCart(data.userId);

  return order;
}

export async function getUserOrders(userId: string) {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(orderId: string, userId: string) {
  return await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              bike: { include: { brand: true } },
            },
          },
        },
      },
      address: true,
    },
  });
}

interface SubmitReviewResult {
  success: boolean;
  error?: string;
}

/* -------------------------
   SUBMIT REVIEW
-------------------------- */
export async function submitReview(
  formData: FormData
): Promise<SubmitReviewResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be logged in to submit a review',
      };
    }

    const productId = formData.get('productId') as string;
    const rating = Number(formData.get('rating'));
    const title = (formData.get('title') as string) || null;
    const comment = (formData.get('comment') as string)?.trim();

    if (!productId || !rating || !comment) {
      return { success: false, error: 'Missing required fields' };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    if (comment.length < 10) {
      return {
        success: false,
        error: 'Review must be at least 10 characters',
      };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this product',
      };
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: 'DELIVERED',
        },
      },
    });

    await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        title,
        comment,
        isVerifiedPurchase: !!hasPurchased,
        isApproved: true,
        images: [],
      },
    });

    revalidatePath('/products/[product]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Submit review error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

/* -------------------------
   UPDATE REVIEW
-------------------------- */
export async function updateReview(
  reviewId: string,
  formData: FormData
): Promise<SubmitReviewResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in' };
    }

    const rating = Number(formData.get('rating'));
    const title = (formData.get('title') as string) || null;
    const comment = (formData.get('comment') as string)?.trim();

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (review.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        title,
        comment,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/products/[product]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Update review error:', error);
    return { success: false, error: 'Failed to update review' };
  }
}

/* -------------------------
   DELETE REVIEW
-------------------------- */
export async function deleteReview(
  reviewId: string
): Promise<SubmitReviewResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in' };
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (review.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath('/products/[product]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Delete review error:', error);
    return { success: false, error: 'Failed to delete review' };
  }
} 