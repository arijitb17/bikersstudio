// app/categories/[category]/page.tsx
export const dynamic = 'force-dynamic'
import { getCategoryWithProducts } from '@/lib/actions';
import { notFound } from 'next/navigation';
import CategoryPageClient from '../CategoryPageClient';

export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await params;
  const category = await getCategoryWithProducts(categorySlug);
  if (!category) notFound();

  return <CategoryPageClient category={{
  ...category,
  description: category.description ?? undefined,
}} />;
}