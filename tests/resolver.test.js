import { listMissingDependencies } from 'src/resolver';

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

  test('nested', () => {
    // eslint-disable-next-line no-undef
    expect(listMissingDependencies('easy.each()', { easy: { each() { easy.foo(); } } })).toEqual([{
      kind: 'ReferenceError',
      path: ['easy', 'foo'],
    }]);
  });
});
