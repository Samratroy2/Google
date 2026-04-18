import { useState, useMemo } from 'react';

/**
 * Generic filter hook for arrays.
 * Supports status, type, urgency, and text search filters.
 */
export function useFilters(items, searchFields = []) {
  const [filters, setFilters] = useState({
    status:  'All',
    type:    'All',
    urgency: 'All',
    search:  '',
  });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const resetFilters = () =>
    setFilters({ status: 'All', type: 'All', urgency: 'All', search: '' });

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filters.status  !== 'All' && item.status  !== filters.status)  return false;
      if (filters.type    !== 'All' && item.type    !== filters.type)    return false;
      if (filters.urgency !== 'All' && item.urgency !== filters.urgency) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = searchFields.some(field =>
          String(item[field] || '').toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [items, filters, searchFields]);

  return { filters, setFilter, resetFilters, filtered };
}
