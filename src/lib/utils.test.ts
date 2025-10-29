import { describe, it, expect } from 'vitest';
import { cn } from './utils';

/**
 * Example unit test for utility functions
 * Following Vitest guidelines: descriptive tests, Arrange-Act-Assert pattern
 */
describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    // Arrange
    const class1 = 'text-red-500';
    const class2 = 'font-bold';

    // Act
    const result = cn(class1, class2);

    // Assert
    expect(result).toBe('text-red-500 font-bold');
  });

  it('should handle conditional classes', () => {
    // Arrange
    const condition = true;

    // Act
    const result = cn('base-class', condition && 'conditional-class');

    // Assert
    expect(result).toBe('base-class conditional-class');
  });

  it('should merge Tailwind classes correctly', () => {
    // Arrange - conflicting padding classes
    const class1 = 'p-4';
    const class2 = 'p-8';

    // Act
    const result = cn(class1, class2);

    // Assert - last one wins
    expect(result).toBe('p-8');
  });

  it('should handle undefined and null values', () => {
    // Act
    const result = cn('base', undefined, null, 'final');

    // Assert
    expect(result).toBe('base final');
  });

  it('should handle empty input', () => {
    // Act
    const result = cn();

    // Assert
    expect(result).toBe('');
  });
});
