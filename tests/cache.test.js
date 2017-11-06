import generic, { acorn } from 'src/cache';

describe('#acorn', () => {
  test('accepts string functions and doesn\'t cache their ast', () => {
    expect(acorn.parse('() => {}')).toBeDefined();
    expect(acorn.parse('() => {}')).not.toBe(acorn.parse('() => {}'));
  });

  test('accepts functions and cache their ast', () => {
    const x = () => {};
    expect(acorn.parse(x)).toBeDefined();
    expect(acorn.parse(x)).toBe(acorn.parse(x));
  });
});

describe('#generic', () => {

})
