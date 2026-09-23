'use client';

import React from 'react';
import { initialSiteSettings } from '@/data/settings';
import { Product } from '@/types';
import { ProductSchema } from './ProductSchema';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  product?: Product;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Aapla Jalgaonwala | Authentic Jalgaon Taste in Every Bite',
  description = 'Authentic Jalgaon banana chips in 10 unique flavours, farsaan, kitchen masalas, and regional dry chutneys. Directly sourced from Jalgaon farmers.',
  canonical = 'https://aaplajalgaonwala.com',
  ogImage = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80',
  product
}) => {
  const [actualCanonical, setActualCanonical] = React.useState(canonical);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // If we are on product details, use precise clean product canonical, otherwise match the route path
      if (product) {
        setActualCanonical(`https://aaplajalgaonwala.com/product/${product.slug}`);
      } else {
        setActualCanonical(`https://aaplajalgaonwala.com${path}`);
      }
    }
  }, [product]);

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: initialSiteSettings.storeName,
    legalName: initialSiteSettings.storeLegalNamePvt,
    url: 'https://aaplajalgaonwala.com',
    logo: 'https://aaplajalgaonwala.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: initialSiteSettings.contactPhone,
      contactType: 'customer support',
      email: initialSiteSettings.contactEmail,
    },
  };

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: initialSiteSettings.storeLegalNameEnt,
    image: ogImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ground Floor, Shop No. 20, Gat No. 433, Dehu Road, Dehu Yelwadi Road, Yelwadi, Dehu',
      addressLocality: 'Pune',
      addressRegion: 'Maharashtra',
      postalCode: '412109',
      addressCountry: 'IN',
    },
    telephone: initialSiteSettings.contactPhone,
    openingHours: 'Mo-Su 08:00-23:00',
    priceRange: '₹35 - ₹655',
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: initialSiteSettings.storeName,
    url: actualCanonical,
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={actualCanonical} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={actualCanonical} />

      {/* Structured Data */}
      {product && <ProductSchema product={product} siteUrl="https://aaplajalgaonwala.com" />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
    </>
  );
};
