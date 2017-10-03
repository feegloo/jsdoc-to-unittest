import { wrap, stripComments } from 'src/utils';

function call() {
  return '2';
}

function call2() {
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

describe('wrap', () => {
  test('works', () => {
    expect(eval(wrap('call()'))).toEqual('2');
    expect(eval(wrap('call();'))).toEqual('2');
    expect(eval(wrap('call();call2();'))()).toBe(10);
    expect(eval(wrap('call();\n\ncall2();'))()).toBe(10);
    expect(eval(wrap('\n\n;call();call();\n\ncall2();'))()).toBe(10);
    expect(eval(wrap(func))()).toBe(14);
    expect(eval(wrap(func2))()).toBe('210');
    expect(eval(wrap(func3))).toBe('2');
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
});
