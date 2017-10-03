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
  });

  test('mocks functions correctly', () => {
    expect(mock(() => abc.xyz() + obj.foo.bar() + 10, {
      'abc.xyz()': 5,
    }, func => eval(func))()).toBe(16);
  });

  test('mocks functions with params', () => {
    expect(mock(() => foo.bar() + foo.bar(1) + foo.bar(1, 2), {
      'foo.bar()': 5,
      'foo.bar(a)': 10,
      'foo.bar(a,b)': 100,
    }, func => eval(func))()).toBe(115);
  });

  test('mocks getters correctly', () => {
    expect(mock(() => obj.easy + obj.foo.bar() + 10, {
      'obj.easy': 5,
    }, func => eval(func))()).toBe(16);
  });

  test('mocks functions and getters correctly', () => {
    expect(mock(() => obj.easy() + obj.easy + obj.easy([]) + obj.easy(1, 1023232) + obj.foo.bar() + 10, {
      'obj.easy': 5,
      'obj.easy()': 15,
      'obj.easy(a)': 20,
      'obj.easy(a,b)': 10,
    }, func => eval(func))()).toBe(61);
  });

  test('doesn\'t overwrite original properties', () => {
    expect(mock(() => obj.test, {
      'obj.test': 5,
    }, func => eval(func))()).toBe(5);

    expect(obj.test).toBe(2);

    expect(mock(() => obj.test(), {
      'obj.test()': 10,
    }, func => eval(func))()).toBe(10);

    expect(obj.test).toBe(2);
  });

  test('mocked function accepts original arguments', () => {
    expect(mock(() => obj.test(20, 5)(20, 5), {
      'obj.test(a,b)': (a, b) => a + b,
    }, func => eval(func))()).toBe(25);
  });
});
