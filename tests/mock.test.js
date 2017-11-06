import mock from 'src/mock';
import {
  parseKey,
  fallToGlobal,
  getPath,
  isCallable,
  listAccesses,
} from 'src/analyzer';

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
    expect(mock(() => obj.test, {}, func => eval(func))).toBe(2);
    expect(mock(() => obj.foo.bar(), {}, func => eval(func))).toBe(1);
    expect(mock(() => obj.foo.bar(), {
      'obj.aaa': 2,
    }, func => eval(func))).toBe(1);
  });

  test('mocks functions correctly', () => {
    expect(mock(() => abc.xyz() + obj.foo.bar() + 10, { // eslint-disable-line no-undef
      'abc.xyz()': () => 5,
    }, func => eval(func))).toBe(16);
  });

  test('parses multiline functions', () => {
    expect(mock(() => {
      var xyz = 10;
      return abc.xyz() + xyz; // eslint-disable-line no-undef
    }, {
      'abc.xyz()': () => 5,
    }, func => eval(func))).toBe(15);
  });

  test('mocks functions with params', () => {
    // eslint-disable-next-line no-undef
    expect(mock(() => bar.foo.baz() + foo.bar() + foo.bar(1) + foo.bar(1, 2), {
      'foo.bar()': () => 5,
      'foo.bar(1)': () => 10,
      'foo.bar(1,2)': a => 100 + a,
      'bar.foo.baz()': () => 0,
    }, func => eval(func))).toBe(116);
  });

  test('mocks multiple function calls', () => {
    // eslint-disable-next-line no-undef
    expect(mock(() => foo.x().y() + foo.x(1).y(), {
      'foo.x().y()': () => 5,
      'foo.x(1).y()': () => 7,
    }, func => eval(func))).toBe(12);

    expect(mock(() => foo.x().a(2).y() + foo.x(1).a().y(), {
      'foo.x().a(2).y()': () => 6,
      'foo.x(1).a().y()': () => 7,
    }, func => eval(func))).toBe(13);
  });

  test('mocks getters correctly', () => {
    expect(mock(() => obj.easy + obj.foo.bar() + 10, {
      'obj.easy': 5,
    }, func => eval(func))).toBe(16);
  });

  test('mocks functions and getters correctly', () => {
    expect(mock(() => obj.easy() + obj.easy + obj.easy([]) + obj.easy(1, 1032), {
      'obj.easy': 10,
      'obj.easy()': () => 2,
      'obj.easy([])': () => 1,
      'obj.easy(1,1032)': () => 3,
    }, func => eval(func))).toBe(16);

    expect(mock(() => obj.easy + obj.easy(1, 1023232, 2) + obj.foo.bar(), {
      'obj.easy': 10,
      'obj.easy(1, 1023232, 2)': () => 2,
      'obj.easy(1)': () => 1,
    }, func => eval(func))).toBe(13);
  });

  test('mocks chain partially', () => {
    expect(mock(() => obj.foo.a + obj.foo.b, {
      'obj.foo': {
        a: 1,
        b: 2,
      },
    }, func => eval(func))).toBe(3);
  });

  test('mocks chain partially - promise case', async () => {
    expect(await mock(() => contains().then(x => x), {
      'contains()': () => Promise.resolve(10),
    }, func => eval(func))).toBe(10);
  });

  test('doesn\'t overwrite original properties', () => {
    expect(mock(() => obj.test, {
      'obj.test': 5,
    }, func => eval(func))).toBe(5);

    expect(obj.test).toBe(2);

    expect(mock(() => obj.test('test'), {
      'obj.test(\'test\')': x => x,
    }, func => eval(func))).toBe('test');

    expect(obj.test).toBe(2);
  });

  test('proper code flow execution', () => {
    function contains() {
      return obj.abc;
    }

    expect(mock(() => contains(), {
      'obj.abc': 5,
    }, func => eval(func))).toBe(5);
  });

  test('passes arguments', () => {
    function contains(a) {
      return obj.abc + a;
    }

    expect(mock(() => contains(10), {
      'obj.abc': 5,
    }, func => eval(func))).toBe(15);
  });

  test('eval-like', () => {
    expect(mock('contains(20)', {
      'contains(20)': a => 10 + a,
    }, func => eval(func))).toBe(30);
  });

  test('multiline template', async () => {
    global.console = await import('mocks/console');
    global.console = global.console.default;
    console.clearLog();
    expect(await mock(`const promise = frosmo.site.utils.window('foo.bar')
      .then(function(result) {
        console.log(result);    // 123
      });
      var foo = {bar : 123 }
     `, {
      'frosmo.site.utils.window(Types.String)': () => Promise.resolve(123),
    }, func => eval(func))).toHaveLog([123]);
    console.restore();
  });
});

describe('#mock.async', () => {
  test('mocks async functions', async () => {
    expect(await mock.async(async () => {
      const value = await obj.easy();
      return value * 2;
    }, {
      'obj.easy()': () => Promise.resolve(20),
    }, eval)).toBe(40);

    expect(await mock.async(async () => {
      const value = await obj.easy();
      return `${value}DDDD`;
    }, {
      'obj.easy()': () => new Promise((resolve) => { setTimeout(() => { resolve('x'); }, 500); }),
    }, eval)).toBe('xDDDD');
  });
});
