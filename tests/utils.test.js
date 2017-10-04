import { wrap, assertAccess, stripComments } from 'src/utils';

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
`

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

function evaluate(src) {
  return eval(wrap(src));
}

describe('wrap', () => {
  test('works', () => {
    expect(evaluate('call()')).toEqual('2');
    expect(evaluate('call();')).toEqual('2');
    expect(evaluate('call();call2();')()).toBe(10);
    expect(evaluate('call();\n\ncall2();')()).toBe(10);
    expect(evaluate('\n\n;call();call();\n\ncall2();')()).toBe(10);
    expect(evaluate(func)()).toBe(14);
    expect(evaluate(func2)()).toBe('210');
    expect(evaluate(func3)).toBe('2');
  });

  test('clever wrapping', () => {
    expect(evaluate(`easy.utils.each([1, 2, 3], function (value, index) {
      easy.console.log(index, value);
    });`)).toBe()
  });

  test('never throws', () => {
    expect(wrap(false)).toBe('');
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
