import {
  parseKey,
  getPath,
  isCallable,
  listAccesses,
} from 'src/analyzer';

describe('#parseKey', () => {
  test('dot notated', () => {
    expect(parseKey('foo.bar.baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
    }]);

    expect(parseKey('foo.bar.baz(1, 2)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', 2],
      path: ['foo', 'bar', 'baz'],
    }]);
  });

  test('nested', () => {
    expect(parseKey('foo[0].bar().baz(1, 2)')).toEqual([{
      path: ['foo', '0', 'bar', 'baz'],
      calls: 2,
      access: ['access', 'get', 'get', 'call', 0, 'get', 'call', 2],
    }]);

    expect(parseKey('foo[0].bar(10, 12).baz(1, 2);baz.bar(10, 12);')).toEqual([
      {
        calls: 2,
        path: ['foo', '0', 'bar', 'baz'],
        access: ['access', 'get', 'get', 'call', 2, 'get', 'call', 2],
      },
      {
        calls: 1,
        path: ['baz', 'bar'],
        access: ['access', 'get', 'call', 2],
      },
    ]);
  });

  test('toPrimitive', () => {
    expect(parseKey('foo.bar() + xyz()')).toEqual([
      {
        access: ['access', 'get', 'call', 0],
        calls: 1,
        path: ['foo', 'bar'],
      },
      {
        access: ['access', 'call', 0],
        calls: 1,
        path: ['xyz'],
      }]);
  });

  test('mixed', () => {
    expect(parseKey('foo[\'bar\'].baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
    }]);
  });

  test('raises SyntaxError', () => {
    expect(() => parseKey(';;;-/\\\\--;;;')).toThrow(SyntaxError);
  });
});

describe('#listAccesses', () => {
  test('lists accesses', () => {
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz["aaa"]', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz["aaa"]'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa()', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get', 'call', 0]]);
    expect(listAccesses('frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa']))
      .toEqual([['access', 'get', 'get', 'call', 3]]);
    expect(listAccesses('frosmo.xyz.aaa();frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([
      ['access', 'get', 'get', 'call', 0],
      ['access', 'get', 'get'],
    ]);
  });

  test('detects correct number of arguments', () => {
    expect(listAccesses('frosmo.xyz().aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual([
      ['access', 'get', 'call', 0, 'get', 'call', 3],
    ]);
  });

  test('shadows objects', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual([
      ['access', 'get', 'get', 'call', 3],
    ]);
  });

  test('never throws', () => {
    expect(listAccesses('baz.foo.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
    expect(listAccesses('baz.fo;;---o.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
  });
});

describe('#getPath', () => {
  test('get paths correctly', () => {
    expect(getPath('frosmo.test.xyz.call()')).toEqual([['frosmo', 'test', 'xyz', 'call']]);
    expect(getPath('frosmo.yes.hello.call')).toEqual([['frosmo', 'yes', 'hello', 'call']]);
    expect(getPath('easy.easy.hello.call')).toEqual([['easy', 'easy', 'hello', 'call']]);
  });

  test('follows the flow execution', () => {
    expect(getPath('false && frosmo.yes.hello.call')).toEqual([]);
    expect(getPath('false && frosmo.test.xyz.call()')).toEqual([]);
  });

  test('brackets notated', () => {
    expect(getPath('easy[\'bar\'][\'baz\']')).toEqual([['easy', 'bar', 'baz']]);
    expect(getPath('frosmo[0][1][\'bar\']')).toEqual([['frosmo', '0', '1', 'bar']]);
  });

  test('multiple chains', () => {
    expect(getPath('frosmo.test.xyz.call();easy.abc.foo.bar'))
      .toEqual([['frosmo', 'test', 'xyz', 'call'], ['easy', 'abc', 'foo', 'bar']]);
  });

  test('returns first key if no path is present', () => {
    expect(getPath('random')).toEqual([['random']]);
  });

  test('throws SyntaxError', () => {
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
