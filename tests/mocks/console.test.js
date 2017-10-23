import console from 'mocks/console';

describe('Console', () => {
  test('#log', () => {
    expect(console.log(10)).toBe(10);
    expect(console.log(10, 20)).toBe(20);
    expect(console.log()).toBeUndefined();
    expect(console.log([1])).toEqual([1]);
    expect(console.log([1, 2])).toEqual([1, 2]);
    expect(console.log([1, 2], { x: true })).toEqual({ x: true });
  });

  test('same output', () => {

  });
});
