import {
  parseKey,
  parseKeyAsync,
  fallToGlobal,
  getPath,
  isCallable,
  listAccesses,
  listAccessesAsync,
} from 'src/analyzer';
import { Types } from 'src/feedback';

const iterator = {
  * [Symbol.iterator]() {
    const mappedKeys = Object.keys(this);
    while (mappedKeys.length) {
      const mappedKey = mappedKeys.shift();
      yield [
        mappedKey.replace(/\$\d+/, ''),
        this[mappedKey],
      ];
    }
  },
};

describe('#parseKey', () => {
  test('direct', () => {
    expect(parseKey('foo')).toEqual([{
      calls: 0,
      access: ['access'],
      path: ['foo'],
      mapped: {
        foo: ['access'],
        ...iterator,
      },
    }]);

    expect(parseKey('foo()')).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['foo'],
      mapped: {
        foo: ['access', 'call', []],
        ...iterator,
      },
    }]);
  });

  test('getters', () => {
    expect(parseKey('foo.bar.baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
      mapped: {
        foo: ['access'],
        bar: ['get'],
        baz: ['get'],
        ...iterator,
      },
    }]);

    expect(parseKey('foo[\'bar\'].baz')).toEqual([{
      calls: 0,
      access: ['access', 'get', 'get'],
      path: ['foo', 'bar', 'baz'],
      mapped: {
        foo: ['access'],
        bar: ['get'],
        baz: ['get'],
        ...iterator,
      },
    }]);
  });

  test('returns #mapped in correct order', () => {
    expect(Object.keys(parseKey('foo[\'bar\'].baz')[0].mapped)).toEqual(['foo', 'bar', 'baz']);
  });

  test('mapped doesn\'t contain the same keys', () => {
    expect(Object.keys(parseKey('foo.baz.baz')[0].mapped)).toEqual(['foo', 'baz', 'baz$1']);
  });

  xtest('generators', () => {
  })

  test('getters and calls', () => {
    expect(parseKey('foo.bar.baz(1, 2);foo.baz.baz.boo')).toEqual([
      {
        calls: 1,
        access: ['access', 'get', 'get', 'call', [Types.Number, Types.Number]],
        path: ['foo', 'bar', 'baz'],
        mapped: {
          foo: ['access'],
          bar: ['get'],
          baz: ['get', 'call', [Types.Number, Types.Number]],
          ...iterator,
        },
      },
      {
        calls: 0,
        access: ['access', 'get', 'get', 'get'],
        path: ['foo', 'baz', 'baz', 'boo'],
        mapped: {
          foo: ['access'],
          baz: ['get'],
          baz$1: ['get'],
          boo: ['get'],
          ...iterator,
        },
      },
    ]);
  });

  test('calls with primitives', () => {
    expect(parseKey('foo.bar.baz(1, 2)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [Types.Number, Types.Number]],
      path: ['foo', 'bar', 'baz'],
      mapped: {
        foo: ['access'],
        bar: ['get'],
        baz: ['get', 'call', [Types.Number, Types.Number]],
        ...iterator,
      },
    }]);
  });

  test('nested access', () => {
    expect(parseKey('foo[0].bar().baz(1, 2)')).toEqual([{
      path: ['foo', '0', 'bar', 'baz'],
      calls: 2,
      access: ['access', 'get', 'get', 'call', [], 'get', 'call', [Types.Number, Types.Number]],
      mapped: {
        foo: ['access'],
        0: ['get'],
        bar: ['get', 'call', []],
        baz: ['get', 'call', [Types.Number, Types.Number]],
        ...iterator,
      },
    }]);

    expect(parseKey('foo[0].bar(10, 12).baz(1, 2);baz.bar(10, 12);')).toEqual([
      {
        calls: 2,
        path: ['foo', '0', 'bar', 'baz'],
        access: [
          'access',
          'get',
          'get',
          'call',
          [Types.Number, Types.Number],
          'get',
          'call',
          [Types.Number, Types.Number],
        ],
        mapped: {
          foo: ['access'],
          0: ['get'],
          bar: ['get', 'call', [Types.Number, Types.Number]],
          baz: ['get', 'call', [Types.Number, Types.Number]],
          ...iterator,
        },
      },
      {
        calls: 1,
        path: ['baz', 'bar'],
        access: ['access', 'get', 'call', [Types.Number, Types.Number]],
        mapped: {
          baz: ['access'],
          bar: ['get', 'call', [Types.Number, Types.Number]],
          ...iterator,
        },
      },
    ]);
  });

  test('nested functions', () => {
    function contains() {
      return forEach();
    }

    expect(parseKey('contains()', func => eval(func))).toEqual([
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['contains'],
        mapped: {
          contains: ['access', 'call', []],
          ...iterator,
        },
      },
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['forEach'],
        mapped: {
          forEach: ['access', 'call', []],
          ...iterator,
        },
      },
    ]);
  });

  test('return statement', () => {
    expect(parseKey('return foo.bar.baz(1, 2)')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [Types.Number, Types.Number]],
      path: ['foo', 'bar', 'baz'],
      mapped: {
        foo: ['access'],
        bar: ['get'],
        baz: ['get', 'call', [Types.Number, Types.Number]],
        ...iterator,
      },
    }]);

    expect(parseKey(`{
        return xD();
    }`)).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['xD'],
      mapped: {
        xD: ['access', 'call', []],
        ...iterator,
      },
    }]);
  });

  test('analyzes promises as expected', () => {
    expect(parseKey('obj.foo().then')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'call', [], 'get'],
      path: ['obj', 'foo', 'then'],
      mapped: {
        obj: ['access'],
        foo: ['get', 'call', []],
        then: ['get'],
        ...iterator,
      },
    }]);

    expect(parseKey('obj.foo().then(() => {}).catch(() => {})')).toEqual([{
      calls: 3,
      access: ['access', 'get', 'call', [], 'get', 'call', [Types.Function], 'get', 'call', [Types.Function]],
      path: ['obj', 'foo', 'then', 'catch'],
      mapped: {
        obj: ['access'],
        foo: ['get', 'call', []],
        then: ['get', 'call', [Types.Function]],
        catch: ['get', 'call', [Types.Function]],
        ...iterator,
      },
    }]);
  });

  test('Symbol.unscopables', () => {
    expect(parseKey('forEach()')).toEqual([{
      calls: 1,
      access: ['access', 'call', []],
      path: ['forEach'],
      mapped: {
        forEach: ['access', 'call', []],
        ...iterator,
      },
    }]);
  });

  test('currying', () => {
    expect(parseKey('x()(true)(10)([2])')).toMatchSnapshot();
  })

  test('calls with non-primitives', () => {
    expect(parseKey('easy.utils.isDate(new Date()); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [Types.Date]],
      path: ['easy', 'utils', 'isDate'],
      mapped: {
        easy: ['access'],
        utils: ['get'],
        isDate: ['get', 'call', [Types.Date]],
        ...iterator,
      },
    }]);

    expect(parseKey('easy.utils.isDate(easy); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [{ type: 'object', value: null }]],
      path: ['easy', 'utils', 'isDate'],
      mapped: {
        easy: ['access'],
        utils: ['get'],
        isDate: ['get', 'call', [{ type: 'object', value: null }]],
        ...iterator,
      },
    }]);

    expect(parseKey('easy.utils.isDate(new Date(new Date())); // true')).toEqual([{
      calls: 1,
      access: ['access', 'get', 'get', 'call', [
        { type: 'object', value: null },
      ]],
      path: ['easy', 'utils', 'isDate'],
      mapped: {
        easy: ['access'],
        utils: ['get'],
        isDate: ['get', 'call', [{ type: 'object', value: null }]],
        ...iterator,
      },
    }]);
  });

  test('toPrimitive', () => {
    expect(parseKey('foo.bar() + xyz()')).toEqual([
      {
        access: ['access', 'get', 'call', []],
        calls: 1,
        path: ['foo', 'bar'],
        mapped: {
          foo: ['access'],
          bar: ['get', 'call', []],
          ...iterator,
        },
      },
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['xyz'],
        mapped: {
          xyz: ['access', 'call', []],
          ...iterator,
        },
      }]);

    expect(parseKey('foo.bar() + +xyz()')).toEqual([
      {
        access: ['access', 'get', 'call', []],
        calls: 1,
        path: ['foo', 'bar'],
        mapped: {
          foo: ['access'],
          bar: ['get', 'call', []],
          ...iterator,
        },
      },
      {
        access: ['access', 'call', []],
        calls: 1,
        path: ['xyz'],
        mapped: {
          xyz: ['access', 'call', []],
          ...iterator,
        },
      }]);

    expect(() => parseKey('foo.bar[Symbol.hasPrimitive]()')).not.toThrow();
  });

  test('raises SyntaxError', () => {
    expect(() => parseKey(';;;-/\\\\--;;;')).toThrow(SyntaxError);
  });

  test('mapped properties can be iterated', () => {
    const { mapped } = parseKey('foo.foo.baz.boo.baz.bar')[0];
    expect(Object.keys(mapped)).toEqual(['foo', 'foo$1', 'baz', 'boo', 'baz$1', 'bar']);
    expect([...mapped]).toEqual([
      ['foo', ['access']],
      ['foo', ['get']],
      ['baz', ['get']],
      ['boo', ['get']],
      ['baz', ['get']],
      ['bar', ['get']],
    ]);
  });

  test('collects valid feedback', () => {
    function getFromURL(str) {
      return fetch(str); // eslint-disable-line no-undef
    }

    expect(parseKey('getFromURL(\'x\')', func => eval(func)))
      .toEqual([
        {
          path: ['getFromURL'],
          access: ['access', 'call', [Types.String]],
          calls: 1,
          mapped: {
            getFromURL: ['access', 'call', [Types.String]],
            ...iterator,
          },
        },
        {
          path: ['fetch'],
          access: ['access', 'call', [Types.String]],
          calls: 1,
          mapped: {
            fetch: ['access', 'call', [Types.String]],
            ...iterator,
          },
        },
      ]);
  });
});

describe('#parseKeyAsync', () => {
  test('analyzes async functions', async () => {
    expect(await parseKeyAsync(`{
      foo.call();
      await someAsyncCall(20);
      foo.await();
    }`)).toMatchSnapshot();
  });
});

describe('#listAccesses', () => {
  test('lists accesses', () => {
    expect(listAccesses('frosmo', ['frosmo'])).toEqual([['access']]);
    expect(listAccesses('frosmo()', ['frosmo'])).toEqual([['access', 'call', []]]);
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz["aaa"]', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa', ['frosmo.xyz["aaa"]'])).toEqual([['access', 'get', 'get']]);
    expect(listAccesses('frosmo.xyz.aaa()', ['frosmo.xyz.aaa'])).toEqual([['access', 'get', 'get', 'call', []]]);
    expect(listAccesses('frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa()']))
      .toEqual([['access', 'get', 'get', 'call', [Types.Boolean, Types.Boolean, Types.Number]]]);
    expect(listAccesses('frosmo.xyz.aaa();frosmo.xyz.aaa', ['frosmo.xyz.aaa'])).toEqual([
      ['access', 'get', 'get', 'call', []],
      ['access', 'get', 'get'],
    ]);
  });

  test('detects correct number of arguments', () => {
    expect(listAccesses('frosmo.xyz().aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual(
      [['access', 'get', 'call', [], 'get', 'call', [Types.Boolean, Types.Boolean, Types.Number]]],
    );
  });

  test('has optional filter', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', [])).toEqual([
      ['access', 'get', 'call', []],
      ['access', 'get', 'get', 'call', [Types.Boolean, Types.Boolean, Types.Number]],
    ]);

    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)'))
      .toEqual(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', []));
  });

  test('shadows objects', () => {
    expect(listAccesses('lol.xx();frosmo.xyz.aaa(true, false, 2)', ['frosmo.xyz.aaa()'])).toEqual([
      ['access', 'get', 'get', 'call', [Types.Boolean, Types.Boolean, Types.Number]]
    ]);
  });

  test('filters partial chains', () => {
    expect(listAccesses('foo.bar.a;foo.bar.c.x', ['foo.bar'])).toEqual([
      ['access', 'get', 'get'],
      ['access', 'get', 'get', 'get'],
    ]);

    expect(listAccesses('foo.bar.a;foo.bar.c.x', ['foo.bar', 'foo.bar.a'])).toEqual([
      ['access', 'get', 'get'],
      ['access', 'get', 'get', 'get'],
    ]);
  });

  test('nested calls', () => {
    function contains(str) {
      return foo.bar.baz(str);
    }

    expect(listAccesses.call(func => eval(func), 'contains(2)')).toEqual([
      ['access', 'call', [Types.Number]],
      ['access', 'get', 'get', 'call', [Types.Number]],
    ]);
  });

  test('never throws', () => {
    expect(listAccesses('baz.foo.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
    expect(listAccesses('baz.fo;;---o.bar()', ['frosmo.xyz.aaa()'])).toEqual([]);
  });
});

describe('#listAccessAsync', () => {
  test('lists accesses', async () => {
    expect(await listAccessesAsync(`
      const response = await getFromURL('https://mail.google.com/mail/');
      return response.slice(5).trim()`,
    ))
      .toEqual([
        ['access', 'call', [Types.String]],
        ['access', 'get', 'call', [Types.Number], 'call', []],
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
