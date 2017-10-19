import {
  parseKey,
  parseKeyAsync,
  fallToGlobal,
  getPath,
  isCallable,
  listAccesses,
  listAccessesAsync,
} from 'src/analyzer';

describe('#parseKey', () => {
  test('direct', () => {
    expect(parseKey('foo')).toEqual([{
      calls: 0,
      access: ['access'],
      path: ['foo'],
    }]);

    expect(parseKey('foo()')).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['foo'],
    }]);
  });

  test('getters', () => {
    expect(parseKey('foo.bar.baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
    }]);

    expect(parseKey('foo[\'bar\'].baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
    }]);
  });

  test('getters and calls', () => {
    expect(parseKey('foo.bar.baz(1, 2);foo.baz.baz.boo')).toEqual([
      {
        calls: 1,
        access: ['access', 'get', 'get', 'call', [{ type: 'number', value: 1 }, { type: 'number', value: 2 }]],
        path: ['foo', 'bar', 'baz'],
      },
      {
        calls: 0,
        access: ['access', 'get', 'get', 'get'],
        path: ['foo', 'baz', 'baz', 'boo'],
      },
    ]);
  });

  test('calls with primitives', () => {
    expect(parseKey('foo.bar.baz(1, 2)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [
        { value: 1, type: 'number' },
        { value: 2, type: 'number' },
      ]],
      path: ['foo', 'bar', 'baz'],
    }]);
  });

  test('nested access', () => {
    expect(parseKey('foo[0].bar().baz(1, 2)')).toEqual([{
      path: ['foo', '0', 'bar', 'baz'],
      calls: 2,
      access: ['access', 'get', 'get', 'call', [], 'get', 'call', [
        { value: 1, type: 'number' },
        { value: 2, type: 'number' },
      ]],
    }]);

    expect(parseKey('foo[0].bar(10, 12).baz(1, 2);baz.bar(10, 12);')).toEqual([
      {
        calls: 2,
        path: ['foo', '0', 'bar', 'baz'],
        access: ['access', 'get', 'get', 'call', [
          { value: 10, type: 'number' },
          { value: 12, type: 'number' },
        ], 'get', 'call', [
          { value: 1, type: 'number' },
          { value: 2, type: 'number' },
        ]],
      },
      {
        calls: 1,
        path: ['baz', 'bar'],
        access: ['access', 'get', 'call', [
          { value: 10, type: 'number' },
          { value: 12, type: 'number' },
        ]],
      },
    ]);
  });

  test('nested functions', () => {
    function contains() {
      return forEach();
    }

    expect(parseKey('contains()', func => eval(func), true)).toEqual([
      { access: ['access', 'call', []], calls: 1, path: ['contains'] },
      { access: ['access', 'call', []], calls: 1, path: ['forEach'] },
    ]);
  });

  test('return statement', () => {
    expect(parseKey('return foo.bar.baz(1, 2)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [
        { value: 1, type: 'number' },
        { value: 2, type: 'number' },
      ]],
      path: ['foo', 'bar', 'baz'],
    }]);

    expect(parseKey(`{
        return xD();
    }`)).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['xD'],
    }]);
  });

  test('Symbol.unscopables', () => {
    expect(parseKey('forEach()')).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['forEach'],
    }]);
  });

  test('calls with non-primitives', () => {
    expect(parseKey('easy.utils.isDate(new Date()); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [{ type: 'object', value: null }]],
      path: ['easy', 'utils', 'isDate'],
    }]);

    expect(parseKey('easy.utils.isDate(easy); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [{ type: 'object', value: null }]],
      path: ['easy', 'utils', 'isDate'],
    }]);

    expect(parseKey('easy.utils.isDate(new Date(new Date())); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [
        { type: 'object', value: null },
      ]],
      path: ['easy', 'utils', 'isDate'],
    }]);
  });

  test('toPrimitive', () => {
    expect(parseKey('foo.bar() + xyz()')).toEqual([
      {
        access: ['access', 'get', 'call', []],
        calls: 1,
        path: ['foo', 'bar'],
      },
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['xyz'],
      }]);

    expect(parseKey('foo.bar() + +xyz()')).toEqual([
      {
        access: ['access', 'get', 'call', []],
        calls: 1,
        path: ['foo', 'bar'],
      },
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['xyz'],
      }]);

    expect(() => parseKey('foo.bar[Symbol.hasPrimitive]()')).not.toThrow();
  });


  test('raises SyntaxError', () => {
    expect(() => parseKey(';;;-/\\\\--;;;')).toThrow(SyntaxError);
  });
});

describe('#parseKeyAsync', () => {
  test('analyzes promises as expected', async () => {
    expect(await parseKeyAsync('obj.foo().then')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'call', []],
      path: ['obj', 'foo'],
      special: 'Promise',
    }]);

    expect(await parseKeyAsync('obj.foo().then(console.log).catch(console.log)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'call', []],
      path: ['obj', 'foo'],
      special: 'Promise',
    }]);
  });
});

describe('#listAccesses', () => {
  test('lists accesses', () => {
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz["aaa"]', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz["aaa"]'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa()', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get', 'call', []]]);
    expect(listAccesses('frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa']))
      .toEqual([['access', 'get', 'get', 'call', [
        { type: 'boolean', value: true },
        { type: 'boolean', value: false },
        { type: 'number', value: 2 },
      ]]]);
    expect(listAccesses('frosmo.xyz.aaa();frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([
      ['access', 'get', 'get', 'call', []],
      ['access', 'get', 'get'],
    ]);
  });

  test('detects correct number of arguments', () => {
    expect(listAccesses('frosmo.xyz().aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual([
      ['access', 'get', 'call', [], 'get', 'call', [
        { type: 'boolean', value: true },
        { type: 'boolean', value: false },
        { type: 'number', value: 2 },
      ]],
    ]);
  });

  test('has optional filter', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', [])).toEqual([
      ['access', 'get', 'call', []],
      ['access', 'get', 'get', 'call', [
        { type: 'boolean', value: true },
        { type: 'boolean', value: false },
        { type: 'number', value: 2 },
      ]],
    ]);

    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)')).toEqual([
      ['access', 'get', 'call', []],
      ['access', 'get', 'get', 'call', [
        { type: 'boolean', value: true },
        { type: 'boolean', value: false },
        { type: 'number', value: 2 },
      ]],
    ]);
  });

  test('shadows objects', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual([
      ['access', 'get', 'get', 'call', [
        { type: 'boolean', value: true },
        { type: 'boolean', value: false },
        { type: 'number', value: 2 },
      ]],
    ]);
  });

  test('nested calls', () => {
    function contains(str) {
      return foo.bar.baz(str);
    }

    expect(listAccesses.call(func => eval(func), 'contains(2)')).toEqual([
      ['access', 'call', [{ type: 'number', value: 2 }]],
      ['access', 'get', 'get', 'call', [{ type: 'number', value: 2 }]],
    ]);
  });

  test('never throws', () => {
    expect(listAccesses('baz.foo.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
    expect(listAccesses('baz.fo;;---o.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
  });
});

describe('#listAccessAsync', () => {
  test('lists accesses', async () => {
    expect(await listAccessesAsync(`(() =>
    getFromURL('https://mail.google.com/mail/').then(response => response.slice(5).trim()))()`,
    ))
      .toEqual([
        ['access', 'call', [{ type: 'string', value: 'https://mail.google.com/mail/' }]]
      ]);
  });

  test('never throws', async () => {
    expect(await listAccessesAsync('baz.foo.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
    expect(await listAccessesAsync('baz.fo;;---o.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
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

  test('simple nested calls', () => {
    function contains() {
      return foo.bar.baz();
    }

    expect(getPath.call(func => eval(func), 'contains()', true)).toEqual([
      ['contains'],
      ['foo', 'bar', 'baz'],
    ]);
  });

  test('nested calls', () => {
    function forEach() {
      return foo.bar.baz();
    }

    function contains() {
      return forEach([1, 2]);
    }

    expect(getPath.call(func => eval(func), 'contains()', true)).toEqual([
      ['contains'],
      ['forEach'],
      ['foo', 'bar', 'baz'],
    ]);
  });

  test('nested calls #2', () => {
    function forEach(func) {
      return func();
    }

    function context() {
      return foo.bar.baz;
    }

    function contains() {
      return forEach(context());
    }

    expect(getPath.call(func => eval(func), 'contains()', true)).toEqual([
      ['contains'],
      ['forEach'],
      ['context'],
      ['foo', 'bar', 'baz'],
    ]);
  });

  test('\'inaccessible\' nested calls', () => {
    function forEach(func) {
      return func();
    }

    function contains() {
      function context() {
        return foo.bar.baz;
      }

      return forEach(context());
    }

    expect(getPath.call(func => eval(func), 'contains()', true)).toEqual([
      ['contains'],
      ['forEach'],
      ['context'],
      ['foo', 'bar', 'baz'],
    ]);
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
    expect(isCallable('foo[0].bar();foo.bar()', ['foo[0].bar'], true)).toBe(true);
  });
});

describe('#fallToGlobal', () => {
  test('gives upon SyntaxError', () => {
    expect(fallToGlobal({}, eval)['---;;;;---']).toBe(undefined);
  });
});
