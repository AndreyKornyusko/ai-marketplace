'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CategoryCount, SortOption } from '@/lib/api';

interface FilterSidebarProps {
  categories: CategoryCount[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function FilterSidebar({
  categories,
}: FilterSidebarProps): React.JSX.Element {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Derive all filter state from URL — single source of truth
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') ?? '';
  const activeMinPrice = searchParams.get('minPrice') ?? '';
  const activeMaxPrice = searchParams.get('maxPrice') ?? '';
  const activeSort = searchParams.get('sort') ?? '';
  // Tags stored as comma-separated string in URL: ?tags=cotton,slim
  const activeTagsRaw = searchParams.get('tags') ?? '';
  const activeTags = activeTagsRaw ? activeTagsRaw.split(',').filter(Boolean) : [];

  const updateParams = (updates: Record<string, string | undefined>): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ''}`);
  };

  const handleCategoryChange = (category: string, checked: boolean): void => {
    updateParams({ category: checked ? category : undefined });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateParams({ minPrice: e.target.value || undefined });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateParams({ maxPrice: e.target.value || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    updateParams({ sort: e.target.value || undefined });
  };

  const handleTagToggle = (tag: string): void => {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];
    updateParams({ tags: next.length > 0 ? next.join(',') : undefined });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const raw = e.currentTarget.value.trim();
      if (raw && !activeTags.includes(raw)) {
        const next = [...activeTags, raw];
        updateParams({ tags: next.join(',') });
        e.currentTarget.value = '';
      }
    }
  };

  const handleRemoveTag = (tag: string): void => {
    const next = activeTags.filter((t) => t !== tag);
    updateParams({ tags: next.length > 0 ? next.join(',') : undefined });
  };

  const hasActiveFilters =
    Boolean(activeCategory) ||
    Boolean(activeMinPrice) ||
    Boolean(activeMaxPrice) ||
    Boolean(activeSort) ||
    activeTags.length > 0;

  return (
    <aside className="w-full lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between">
        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-900 lg:hidden"
        >
          Filters
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-4 w-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {/* Desktop heading */}
        <h2 className="hidden text-lg font-semibold text-gray-900 lg:block">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={() => router.push('/products')}
            className="text-sm text-gray-500 underline transition-colors hover:text-gray-900"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Collapsible content: hidden on mobile unless mobileOpen, always visible on lg+ */}
      <div className={`space-y-6 ${mobileOpen ? 'mt-4 block' : 'hidden lg:mt-0 lg:block'}`}>
        {/* Sort */}
        <div>
          <label
            htmlFor="sort-select"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Sort by
          </label>
          <select
            id="sort-select"
            value={activeSort}
            onChange={handleSortChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Categories — single select via radio-style checkboxes */}
        {categories.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Category</h3>
            <div className="space-y-2">
              {categories.map(({ category, count }) => (
                <label key={category} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={activeCategory === category}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <span className="flex-1 text-sm text-gray-700">{category}</span>
                  <span className="text-xs text-gray-400">({count})</span>
                </label>
              ))}
              {activeCategory && (
                <button
                  onClick={() => updateParams({ category: undefined })}
                  className="mt-1 text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Clear category
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price range */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">Price Range</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="min-price" className="sr-only">
                Minimum price
              </label>
              <input
                id="min-price"
                type="number"
                min={0}
                placeholder="Min"
                value={activeMinPrice}
                onChange={handleMinPriceChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex-1">
              <label htmlFor="max-price" className="sr-only">
                Maximum price
              </label>
              <input
                id="max-price"
                type="number"
                min={0}
                placeholder="Max"
                value={activeMaxPrice}
                onChange={handleMaxPriceChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Tags multi-select */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">Tags</h3>

          {/* Active tag pills */}
          {activeTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {activeTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="ml-0.5 hover:text-gray-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag toggle chips from categories (derived from sidebar context) */}
          <div className="mb-2 flex flex-wrap gap-1">
            {categories.map(({ category }) => (
              <button
                key={category}
                onClick={() => handleTagToggle(category)}
                className={`rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                  activeTags.includes(category)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Free-text tag input */}
          <input
            type="text"
            placeholder="Type a tag, press Enter"
            onKeyDown={handleTagInputKeyDown}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            aria-label="Add custom tag filter"
          />
        </div>
      </div>
    </aside>
  );
}
