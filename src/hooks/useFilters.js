import { useState, useMemo, useCallback } from 'react';

/**
 * Generic filter hook for arrays.
 * Supports status, type, urgency, and text search filters.
 */
export function useFilters(items = [], searchFields = []) {

  const [filters, setFilters] = useState({
    status:  'All',
    type:    'All',
    urgency: 'All',
    search:  '',
  });

  // ✅ stable setter (prevents unnecessary re-renders)
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'All',
      type: 'All',
      urgency: 'All',
      search: ''
    });
  }, []);

  const filtered = useMemo(() => {
    if (!items.length) return [];

    const q = filters.search.trim().toLowerCase();

    return items.filter(item => {

      if (filters.status !== 'All' && item.status !== filters.status) return false;
      if (filters.type !== 'All' && item.type !== filters.type) return false;
      if (filters.urgency !== 'All' && item.urgency !== filters.urgency) return false;

      if (q) {
        const match = searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(q);
        });

        if (!match) return false;
      }

      return true;
    });

  }, [items, filters, searchFields]);

  return {
    filters,
    setFilter,
    resetFilters,
    filtered,
  };
}