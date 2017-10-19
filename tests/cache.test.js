import cache from 'src/cache';

describe('#ast', () => {
  test('accepts string functions and doesn\'t cache their ast', () => {
    expect(cache.ast.get('() => {}')).toBeDefined();
    expect(cache.ast.get('() => {}')).not.toBe(cache.ast.get('() => {}'));
  });

  test('accepts functions and cache their ast', () => {
    const x = () => {};
    expect(cache.ast.get(x)).toBeDefined();
    expect(cache.ast.get(x)).toBe(cache.ast.get(x));
  });
});
