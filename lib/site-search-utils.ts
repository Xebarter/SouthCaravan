export type CategorySuggestionType = 'category' | 'subcategory' | 'subSubcategory';

export type CategorySuggestion = {
  kind: 'product' | 'service';
  type: CategorySuggestionType;
  value: string;
  parentCategory: string | null;
  parentSubcategory: string | null;
  label: string;
  context: string | null;
  image: string | null;
};

export type SearchProductResult = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  subSubcategory: string;
  image: string | null;
  price: number;
  currency: string;
  inStock: boolean;
  featured: boolean;
};

export type SearchServiceResult = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  image: string | null;
  pricingType: 'fixed' | 'hourly';
  rate: number;
  currency: string;
  featured: boolean;
};

export type SiteSearchResults = {
  products: SearchProductResult[];
  services: SearchServiceResult[];
  categories: CategorySuggestion[];
};

export function escapeIlikePattern(q: string) {
  return q.replace(/[%_]/g, '');
}

export function scoreSearchText(query: string, value: string): number {
  const qLower = query.trim().toLowerCase();
  const v = value.toLowerCase();
  if (!qLower || !v) return 0;

  if (v === qLower) return 200;
  if (v.startsWith(qLower)) return 160;
  if (v.includes(qLower)) return 110;

  const tokens = qLower.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const matched = tokens.filter((token) => v.includes(token)).length;
    if (matched === tokens.length) return 85 + matched * 8;
    if (matched > 0) return 35 + matched * 18;
  }

  return 0;
}

export function scoreProductMatch(query: string, product: SearchProductResult): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return (product.featured ? 20 : 0) + (product.inStock ? 3 : 0);
  }

  let score = 0;
  score += scoreSearchText(q, product.name) * 1.2;
  score += scoreSearchText(q, product.category) * 0.35;
  score += scoreSearchText(q, product.subcategory) * 0.25;
  score += scoreSearchText(q, product.subSubcategory) * 0.15;
  if (product.featured) score += 8;
  if (product.inStock) score += 4;
  return score;
}

export function scoreServiceMatch(query: string, service: SearchServiceResult): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return service.featured ? 20 : 0;
  }

  let score = 0;
  score += scoreSearchText(q, service.title) * 1.2;
  score += scoreSearchText(q, service.category) * 0.35;
  score += scoreSearchText(q, service.subcategory) * 0.25;
  if (service.featured) score += 8;
  return score;
}

export function productDetailHref(productId: string) {
  return `/product/${productId}`;
}

export function serviceDetailHref(serviceId: string) {
  return `/public/services/${serviceId}`;
}

export function searchResultsHref(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return '/search';
  return `/search?q=${encodeURIComponent(trimmed)}`;
}

export function categorySuggestionHref(suggestion: CategorySuggestion): string {
  const params = new URLSearchParams();
  if (suggestion.kind === 'service') {
    params.set('type', 'services');
  }

  if (suggestion.type === 'category') {
    params.set('category', suggestion.value);
  } else if (suggestion.type === 'subcategory') {
    if (suggestion.parentCategory) params.set('category', suggestion.parentCategory);
    params.set('subcategory', suggestion.value);
  } else {
    if (suggestion.parentCategory) params.set('category', suggestion.parentCategory);
    if (suggestion.parentSubcategory) params.set('subcategory', suggestion.parentSubcategory);
  }

  return `/categories?${params.toString()}`;
}

export type RankedSearchItem =
  | ({ kind: 'product' } & SearchProductResult & { score: number })
  | ({ kind: 'service' } & SearchServiceResult & { score: number });

export function rankSearchItems(
  query: string,
  products: SearchProductResult[],
  services: SearchServiceResult[],
  limit = 8,
): RankedSearchItem[] {
  const ranked: RankedSearchItem[] = [
    ...products.map((product) => ({
      kind: 'product' as const,
      ...product,
      score: scoreProductMatch(query, product),
    })),
    ...services.map((service) => ({
      kind: 'service' as const,
      ...service,
      score: scoreServiceMatch(query, service),
    })),
  ];

  return ranked
    .sort((a, b) => b.score - a.score || getItemLabel(a).localeCompare(getItemLabel(b)))
    .slice(0, limit);
}

function getItemLabel(item: RankedSearchItem) {
  return item.kind === 'product' ? item.name : item.title;
}
