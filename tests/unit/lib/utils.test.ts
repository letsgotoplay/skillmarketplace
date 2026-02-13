import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toContain('py-1');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toContain('base');
    expect(result).toContain('end');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      active: true,
      disabled: false,
      visible: true,
    });
    expect(result).toContain('active');
    expect(result).toContain('visible');
    expect(result).not.toContain('disabled');
  });
});
