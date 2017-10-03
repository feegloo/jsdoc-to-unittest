import { getPath, isCallable } from 'src/analyzer';

describe('#getPath', () => {
  test('get paths correctly', () => {
    expect(getPath('frosmo.test.xyz.call()')).toEqual([['test', 'xyz', 'call']]);
    expect(getPath('frosmo.yes.hello.call')).toEqual([['yes', 'hello', 'call']]);
    expect(getPath('easy.easy.hello.call')).toEqual([['easy', 'hello', 'call']]);
  });

  test('multiple chains', () => {
    expect(getPath('frosmo.test.xyz.call();easy.abc.foo.bar'))
      .toEqual([['test', 'xyz', 'call'], ['abc', 'foo', 'bar']]);
  });

  test('accepts other arguments', () => {
    expect(getPath('random.one.two', ['random'])).toEqual([['one', 'two']]);
  });

  test('returns empty array if no path is present', () => {
    expect(getPath('random', ['random'])).toEqual([]);
  });

  test('throws as expected', () => {
    expect(() => getPath('var random = {}; random.one.two', ['reference'])).toThrow(TypeError);
    expect(() => getPath('random.one.two', ['reference'])).toThrow(ReferenceError);
    expect(() => getPath('---')).toThrow(SyntaxError);
  });
});

describe('#isCallable', () => {
  test('works correctly', () => {
    expect(isCallable('easy.bar.yes()', ['easy.bar.yes'])).toBe(true);
    expect(isCallable('frosmo.yes()', ['frosmo.yes'])).toBe(true);
    expect(isCallable('frosmo.yes', ['frosmo.yes'])).toBe(false);
    expect(isCallable('frosmo.xyz()', ['frosmo.abc'])).toBe(false);
  });

  test('multiple chains', () => {
    expect(isCallable('foo.bar();foo.bar', ['foo.bar'])).toBe(true);
    expect(isCallable('foo.bar();foo.bar()', ['foo.bar'])).toBe(true);
  });

  test('multiple chains with all flag', () => {
    expect(isCallable('foo.bar();foo.bar', ['foo.bar'], true)).toBe(false);
    expect(isCallable('foo.bar();foo.bar()', ['foo.bar'], true)).toBe(true);
  });
});
