import mock from 'src/mock';

const obj = {
  test: 2,
  foo: {
    bar() {
      return 1;
    },
  },
};

describe('#mock', () => {
  test('has proper access to scope', () => {
    expect(mock(() => obj.test, {}, func => eval(func))()).toBe(2);
    expect(mock(() => obj.foo.bar(), {}, func => eval(func))()).toBe(1);
    expect(mock(() => obj.foo.bar(), {
      'obj.aaa': 2,
    }, func => eval(func))()).toBe(1);
  });

  test('mocks functions correctly', () => {
    expect(mock(() => abc.xyz() + obj.foo.bar() + 10, {
      'abc.xyz()': () => 5,
    }, func => eval(func))()).toBe(16);
  });

  test('mocks functions with params', () => {
    expect(mock(() => bar.foo.baz() + foo.bar() + foo.bar(1) + foo.bar(1, 2), { // eslint-disable-line no-undef
      'foo.bar()': () => 5,
      'foo.bar(1)': () => 10,
      'foo.bar(1,2)': a => 100 + a,
      'bar.foo.baz()': () => 0,
    }, func => eval(func))()).toBe(116);
  });

  test('mocks getters correctly', () => {
    expect(mock(() => obj.easy + obj.foo.bar() + 10, {
      'obj.easy': 5,
    }, func => eval(func))()).toBe(16);
  });

  test('mocks functions and getters correctly', () => {
    expect(mock(() => obj.easy() + obj.easy + obj.easy([]) + obj.easy(1, 1023232), {
      'obj.easy': 10,
      'obj.easy()': () => 2,
      'obj.easy(1)': () => 1,
      'obj.easy(1,2)': () => 3,
    }, func => eval(func))()).toBe(16);

    expect(mock(() => obj.easy + obj.easy(1, 1023232, 2) + obj.foo.bar(), {
      'obj.easy': 10,
      'obj.easy(1, 2, 3)': () => 2,
      'obj.easy(1)': () => 1,
    }, func => eval(func))()).toBe(13);
  });

  test('doesn\'t overwrite original properties', () => {
    expect(mock(() => obj.test, {
      'obj.test': 5,
    }, func => eval(func))()).toBe(5);

    expect(obj.test).toBe(2);

    expect(mock(() => obj.test('test'), {
      'obj.test(1)': x => x,
    }, func => eval(func))()).toBe('test');

    expect(obj.test).toBe(2);
  });
});
