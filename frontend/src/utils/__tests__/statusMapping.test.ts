import { getStatusLabel, getStatusInteger, getStatusVariant } from '../statusMapping';

describe('Status Mapping Utilities', () => {
  describe('getStatusLabel', () => {
    it('should convert integer values to labels', () => {
      expect(getStatusLabel('1')).toBe('Future');
      expect(getStatusLabel('2')).toBe('Partially Paid');
      expect(getStatusLabel('3')).toBe('Paid');
      expect(getStatusLabel('4')).toBe('Overdue');
      expect(getStatusLabel('5')).toBe('Foreclose');
      expect(getStatusLabel('6')).toBe('Paid (Pending Approval)');
      expect(getStatusLabel('7')).toBe('Paid Rejected');
    });

    it('should return labels as-is if already a label', () => {
      expect(getStatusLabel('Foreclose')).toBe('Foreclose');
      expect(getStatusLabel('Paid')).toBe('Paid');
      expect(getStatusLabel('Partially Paid')).toBe('Partially Paid');
    });

    it('should handle null/undefined values', () => {
      expect(getStatusLabel(null)).toBe('Unknown');
      expect(getStatusLabel(undefined)).toBe('Unknown');
      expect(getStatusLabel('')).toBe('Unknown');
    });

    it('should handle unknown integer values', () => {
      expect(getStatusLabel('99')).toBe('99');
    });
  });

  describe('getStatusInteger', () => {
    it('should convert labels to integer values', () => {
      expect(getStatusInteger('Future')).toBe('1');
      expect(getStatusInteger('Partially Paid')).toBe('2');
      expect(getStatusInteger('Paid')).toBe('3');
      expect(getStatusInteger('Overdue')).toBe('4');
      expect(getStatusInteger('Foreclose')).toBe('5');
      expect(getStatusInteger('Paid (Pending Approval)')).toBe('6');
      expect(getStatusInteger('Paid Rejected')).toBe('7');
    });

    it('should return integers as-is if already an integer', () => {
      expect(getStatusInteger('5')).toBe('5');
      expect(getStatusInteger('1')).toBe('1');
    });

    it('should handle null/undefined values', () => {
      expect(getStatusInteger(null)).toBe('1');
      expect(getStatusInteger(undefined)).toBe('1');
      expect(getStatusInteger('')).toBe('1');
    });

    it('should handle unknown labels', () => {
      expect(getStatusInteger('Unknown Status')).toBe('1');
    });
  });

  describe('getStatusVariant', () => {
    it('should return correct CSS classes for different statuses', () => {
      expect(getStatusVariant('5')).toContain('bg-purple-100 text-purple-800');
      expect(getStatusVariant('Foreclose')).toContain('bg-purple-100 text-purple-800');
      expect(getStatusVariant('3')).toContain('bg-green-100 text-green-800');
      expect(getStatusVariant('Paid')).toContain('bg-green-100 text-green-800');
      expect(getStatusVariant('2')).toContain('bg-yellow-100 text-yellow-800');
      expect(getStatusVariant('Partially Paid')).toContain('bg-yellow-100 text-yellow-800');
    });

    it('should handle unknown statuses', () => {
      expect(getStatusVariant('Unknown')).toContain('bg-gray-100 text-gray-800');
    });
  });
});
