
import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export const useTableSorting = <T extends string>(initialField: T) => {
  const [sortField, setSortField] = useState<T>(initialField);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = <D extends Record<string, any>>(data: D[], getValue: (item: D, field: T) => any) => {
    if (!data || data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortField);
      const bValue = getValue(b, sortField);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const numA = Number(aValue);
      const numB = Number(bValue);
      
      if (isNaN(numA) || isNaN(numB)) {
        const strA = String(aValue);
        const strB = String(bValue);
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }
      
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  };

  return { sortField, sortDirection, handleSort, getSortedData };
};
