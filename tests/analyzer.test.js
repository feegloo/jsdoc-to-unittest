import {
  parseKey,
  getPath,
  isCallable,
  listAccesses,
} from 'src/analyzer';

describe('#parseKey', () => {
  test('dot notated', () => {
    expect(parseKey('foo.bar.baz')).toEqual({
      args: 0,
      isCalled: false,
      key: 'foo.bar.baz',
      path: ['access', 'get', 'get'],
      fullPath: ['foo', 'bar', 'baz'],
    });

    expect(parseKey('foo.bar.baz(1, 2)')).toEqual({
      args: 2,
      isCalled: true,
      key: 'foo.bar.baz',
      path: ['access', 'get', 'get', 'call'],
      fullPath: ['foo', 'bar', 'baz'],
    });
  });

  test('nested', () => {
    expect(parseKey('foo[0].bar().baz(1, 2)')).toEqual({
    });
  });

  test('mixed', () => {
    expect(parseKey('foo[\'bar\'].baz')).toEqual({
      args: 0,
      isCalled: false,
      key: 'foo[\'bar\'].baz',
      path: ['access', 'get', 'get'],
      fullPath: ['foo', 'bar', 'baz'],
    });
  });

  test('raises SyntaxError', () => {

  });
});

describe('#listAccesses', () => {
  test('lists accesses', () => {
    expect(listAccesses('frosmo.xyz.aaa', 'frosmo.xyz.aaa')).toEqual([['get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa()', 'frosmo.xyz.aaa')).toEqual([['get', 'get', 'call', 0]]);
    expect(listAccesses('frosmo.xyz.aaa(true, false, 2)', 'frosmo.xyz.aaa')).toEqual([['get', 'get', 'call', 3]]);
    expect(listAccesses('frosmo.xyz.aaa();frosmo.xyz.aaa', 'frosmo.xyz.aaa')).toEqual([
      ['get', 'get', 'call', 0],
      ['get', 'get'],
    ]);
  });

  test('detects correct number of arguments', () => {
    expect(listAccesses('frosmo.xyz.aaa(true, false, 2)', 'frosmo.xyz.aaa()')).toEqual([
      ['get', 'get', 'call', 3],
    ]);
  });

  test('shadows objects', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', 'frosmo.xyz.aaa()')).toEqual([
      ['get', 'get', 'call', 3],
    ]);
  });

  test('never throws', () => {
    expect(listAccesses('baz.foo.bar()', 'frosmo.xyz.aaa()')).toEqual([]);
    expect(listAccesses('baz.fo;;---o.bar()', 'frosmo.xyz.aaa()')).toEqual([]);
  });
});

describe('#getPath', () => {
  test('get paths correctly', () => {
    expect(getPath('frosmo.test.xyz.call()')).toEqual([['test', 'xyz', 'call']]);
    expect(getPath('frosmo.yes.hello.call')).toEqual([['yes', 'hello', 'call']]);
    expect(getPath('easy.easy.hello.call')).toEqual([['easy', 'hello', 'call']]);
  });

  test('follows the flow execution', () => {
    expect(getPath('false && frosmo.yes.hello.call')).toEqual([]);
    expect(getPath('false && frosmo.test.xyz.call()')).toEqual([]);
  });

  test('brackets notated', () => {
    expect(getPath('easy[\'bar\'][\'baz\']')).toEqual([['bar', 'baz']]);
    expect(getPath('frosmo[0][1][\'bar\']')).toEqual([['0', '1', 'bar']]);
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
