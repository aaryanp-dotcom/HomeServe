export type BlogCategory =
  | 'interior-design'
  | 'renovation-guides'
  | 'delhi-ncr-costs'
  | 'room-guides'
  | 'style-spotlights';

export interface BlogCategoryMeta {
  id: BlogCategory;
  name: string;
  tagline: string;
  description: string;
}

export interface BlogSection {
  heading: string;
  content: string; // Markdown / paragraph formatted
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  table?: {
    headers: string[];
    rows: string[][];
  };
  pricingTable?: {
    item: string;
    range: string;
    timeline: string;
  }[];
  checklist?: string[];
  callout?: {
    type: 'tip' | 'warning' | 'info' | 'cost';
    title: string;
    text: string;
  };
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: 'informational' | 'commercial' | 'investigational' | 'commercial_investigation';
  category: BlogCategory;
  categoryLabel: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  heroImage: {
    src: string;
    alt: string;
    caption?: string;
  };
  tableOfContents?: { title: string; anchor: string }[];
  summary: string;
  sections: BlogSection[];
  relatedThemeSlugs: string[];
  relatedServiceSlugs: string[];
  relatedLocations?: string[];
  faq?: { q: string; a: string }[];
  faqs?: { question: string; answer: string }[];
}
