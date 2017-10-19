import listMissingDependencies from 'src/resolver';

describe('#listMissingDependencies', () => {
  test('works', () => {
    expect(listMissingDependencies('[].forEach.call([], easy.utils.each)')).toEqual([{
      kind: 'ReferenceError',
      path: ['easy'],
    }]);

    expect(listMissingDependencies('[].forEach.call([], easy.utils.each)', { easy: null })).toEqual([{
      kind: 'TypeError',
      path: ['easy', 'utils'],
    }]);

    expect(listMissingDependencies('[].forEach.call([], () => easy.utils.each())', { easy: null })).toEqual([]);
    expect(listMissingDependencies('[].forEach.call([1], () => easy.utils.each())', { easy: null })).toEqual([{
      kind: 'TypeError',
      path: ['easy', 'utils'],
    }]);
  });

  test('works for other types than functions', () => {
    expect(listMissingDependencies('x.y', { x: { y: 4 } })).toEqual([]);
    expect(listMissingDependencies('x.y', { x: { y: {} } })).toEqual([]);
    expect(listMissingDependencies('x.y', { x: { y: 'x' } })).toEqual([]);
  });

  test('path is joined as expected', () => {
    class RandomError extends Error {}
    expect(listMissingDependencies('x[0].forEach()', {
      x: [{
        forEach() {
          throw new RandomError('Bo!');
        },
      }],
    })).toEqual([
      { kind: 'RandomError', path: ['x', '0', 'forEach'] },
    ]);
  });

  test('nested', () => {
    // eslint-disable-next-line no-undef
    expect(listMissingDependencies('easy.each()', { easy: { each() { lol.foo(); } } })).toEqual([{
      kind: 'ReferenceError', // lol is undefined
      path: ['easy', 'each'],
    }]);

    const bar = {};
    expect(listMissingDependencies('easy.each()', { easy: { each() { bar.foo(); } } })).toEqual([{
      kind: 'TypeError',
      path: ['easy', 'each'],
    }]);
  });
});
