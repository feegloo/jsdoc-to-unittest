import { wrap, assertAccess, stripComments, evaluate } from 'src/utils';

function call() { // eslint-disable-line no-unused-vars
  return '2';
}

function call2() { // eslint-disable-line no-unused-vars
  return 10;
}

const func = `
  () => {
    var arr = [0, 2];
    var x = call2();
    return arr[1] + +call() + x;
  }
`;

const func2 = `
  var arr = [0, 2];
  var x = call2();
  call() + x;
`;

const func3 = `
  // d
  //dd
  call(); // d
`;

function exec(src) {
  return eval(wrap(src));
}

describe('#wrap', () => {
  test('works', () => {
    expect(exec('call()')).toBe('2');
    expect(exec('call();')).toBe('2');
    expect(exec('2 + +call();')).toBe(4);
    expect(exec('call();call2();')()).toBe(10);
    expect(exec('call();\n\ncall2();')()).toBe(10);
    expect(exec('\n\n;call();call();\n\ncall2();')()).toBe(10);
    expect(exec(func)()).toBe(14);
    expect(exec(func2)()).toBe('210');
    expect(exec(func3)).toBe('2');
  });

  test('mock functions', () => {
    expect(wrap.bind({ call }, 'call', true)()).toBe('mock(call)');
    expect(wrap('call()', true)).toBe('mock(() => call())');
    expect(wrap('call()\ncall2()', true)).toBe('mock(() => {\n' +
      '        call();\n' +
      '        return (call2());\n' +
      '      })');
  });

  test('clever wrapping', () => {
    expect(wrap(`easy.utils.each([1, 2, 3], function (value, index) {
      easy.console.log(index, value);
    });`)).toBe('easy.utils.each([1, 2, 3], function (value, index) {      easy.console.log(index, value)    })');
  });

  test('never throws', () => {
    expect(wrap(false)).toBe('');
    expect(wrap('')).toBe('');
    expect(wrap('--')).toBe('');
    expect(wrap()).toBe('');
    expect(wrap(Function)).toBe('');
  });
});

describe('#stripComments', () => {
  expect(stripComments('test //yes')).toBe('test ');
  expect(stripComments('test / /yes')).toBe('test / /yes');
  expect(stripComments('test /////yes')).toBe('test ');
  expect(stripComments('test//yes')).toBe('test');
  expect(stripComments('test/* ddd */test')).toBe('testtest');
  expect(stripComments('test/*ddd*/test')).toBe('testtest');
  expect(stripComments('test/**/test')).toBe('testtest');
  expect(stripComments(`/**
   * Shared context (XDM RPC) object reference
   * @memberof easy.constants
   * @constant
   * @default
   */
   easy.bla.bla
   `).replace(/\n/g, '').trim()).toBe('easy.bla.bla');
});

describe('#assertAccess', () => {
  test('returns value', () => {
    expect(Function('s', 'with(s){ return foo }')(assertAccess({ foo: 2 }))).toBe(2);
    expect(Function('s', 'with(s){ return foo.bar.x }')(assertAccess({ foo: { bar: { x: '100' } } }))).toBe('100');
    expect(Function('s', 'with(s){ return foo.bar().x }')(assertAccess({ foo: { bar: () => ({ x: '100' }) } }))).toBe('100');
  });

  test('no ReferenceError', () => {
    expect(Function('s', 'with(s){ foo }')(assertAccess({}))).toBe(undefined);
    expect(Function('s', 'with(s){ foo || bar }')(assertAccess({}))).toBe(undefined);
    expect(() => Function('s', 'with(s){ foo }')({})).toThrow(ReferenceError);
  });

  test('no TypeError', () => {
    expect(Function('s', 'with(s){ foo.bar.xyz }')(assertAccess({}))).toBe(undefined);
    expect(() => Function('s', 'with(s){ foo.bar.xyz }')()).toThrow(TypeError);
    expect(() => Function('s', 'with(s){ foo.bar.xyz }')({ foo: {} })).toThrow(TypeError);
  });
});

describe('#evaluate', () => {
  test('evaluates expression', () => {
    expect(evaluate('2 + 2')).toBe(undefined);
  });

  test('sloppy by default', () => {
    expect(() => evaluate('with({}){}')).not.toThrow();
  });

  test('accepts arguments mode is supported', () => {
    expect(evaluate('return a + b', { a: 1, b: 5 }, true)).toBe(6);
  });

  test('strict mode is supported', () => {
    expect(() => evaluate('with({}){}', {}, true)).toThrow();
  });

  test('returns value', () => {
    expect(evaluate('return 2 + 2')).toBe(4);
  });
});
