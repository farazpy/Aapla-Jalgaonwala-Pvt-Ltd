import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CategoryCard } from '@/components/category/CategoryCard';
import { initialCategories } from '@/data/categories';
import { CategoryRepository } from '@/server/repositories/CategoryRepository';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  let categories = initialCategories;
  try {
    const fetched = await CategoryRepository.getAll();
    if (fetched && fetched.length > 0) {
      categories = fetched;
    }
  } catch {
    // fallback
  }

  return (
    <div className="py-12 md:py-20 bg-[#FAF6ED]">
      <SEO
        title="Explore Categories | Aapla Jalgaonwala"
        description="Browse our snack categories: Banana Chips, Farsaan, Kitchen Masalas, Chutneys, Potato Chips, and Combo Packs."
      />

      <Container>
        <SectionHeading
          eyebrow="Explore Our Collections"
          title="Product Categories"
          subtitle="Discover authentic Maharashtrian and Khandeshi flavours categorized for easy browsing."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id || category.slug} category={category} />
          ))}
        </div>
      </Container>
    </div>
  );
}

