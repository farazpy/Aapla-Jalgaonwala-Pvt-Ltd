import React, { useState, useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CategoryCard } from '@/components/category/CategoryCard';
import { initialCategories } from '@/data/categories';
import { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((res) => {
        const list = res.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 md:py-20 bg-[#FAFAF8] min-h-screen">
      <SEO
        title="Explore Categories | Aapla Jalgaonwala"
        description="Browse authentic Khandeshi snack categories with original recipes from Jalgaon."
      />

      <Container>
        <SectionHeading
          eyebrow="Explore Our Collections"
          title="Product Categories"
          subtitle="Discover authentic Maharashtrian and Khandeshi flavours categorized for easy browsing."
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <CategoryCard key={category.id || category.slug} category={category} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
