import {
  isFunction,
  wrap,
  assertAccess,
  stripComments,
  evaluate,
  evaluateAsync,
  isPrimitive,
  getFunctionBody,
  isAsyncFunction,
  getFunctionParams,
} from 'src/utils';


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
  test('works for single-line functions/function calls', () => {
    expect(exec('call()')).toBe('2');
    expect(exec('call();')).toBe('2');
    expect(exec('2 + +call();')).toBe(4);
  });

  test('works for multiline-line code/functions', () => {
    expect(exec(func)()).toBe(14);
    expect(exec('call();call2();')()).toBe(10);
    expect(exec('call();\n\ncall2();')()).toBe(10);
    expect(exec('\n\n;call();call();\n\ncall2();')()).toBe(10);
    expect(exec(func2)()).toBe('210');
    expect(exec(func3)).toBe('2');
  });

  test('doesn\'t touch strings', () => {
    expect(exec('\'x//test\'')).toBe('x//test');
    expect(exec('(() => {\nreturn \'x//test\' })()')).toBe('x//test');
  });

  test('mock functions', () => {
    expect(wrap.call({ call }, 'call()', JSON.stringify({})))
      .toBe('mock(() => call(), {}, func => eval(func))');
    expect(wrap.call({ call }, 'call()', JSON.stringify({ call: 5 })))
      .toBe('mock(() => call(), {"call":5}, func => eval(func))');
  });

  test('clever wrapping', () => {
    const found = [];
    const easy = {
      utils: {
        each(arr) {
          arr.forEach((item) => {
            found.push(item);
          });
        },
      },
    };

    Function('easy', wrap(`easy.utils.each([1, 2, 3], function (value, index) {
      easy.console.log(index, value);
    });`))(easy);

    expect(found).toEqual([1, 2, 3]);
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
  test('line comments', () => {
    expect(stripComments('test //yes')).toBe('test;');
    expect(stripComments('test / /yes')).toBe('test / /yes');
    expect(stripComments('test /////yes')).toBe('test;');
    expect(stripComments('test//yes')).toBe('test;');
  });

  test('block comments', () => {
    expect(stripComments('test /* ddd */\ntest')).toBe('test;\ntest;');
    expect(stripComments('test /*ddd*/;test')).toBe('test;\ntest;');
    expect(stripComments('test /**/;test')).toBe('test;\ntest;');
    expect(stripComments(`/**
   * Shared context (XDM RPC) object reference
   * @memberof easy.constants
   * @constant
   * @default
   */
   easy.bla.bla
   `)).toBe('easy.bla.bla;');
  });

  test('doesn\'t touch strings', () => {
    expect(stripComments('"x//x"')).toBe('\'x//x\';');
    expect(stripComments('\'x//x\'')).toBe('\'x//x\';');
  })
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

describe('#evaluateAsync', () => {
  test('evaluates expression', () => {
    expect(evaluateAsync('2 + 2')).toBeDefined();
  });

  test('evaluates expression asynchronously', async () => {
    expect(await evaluateAsync('2 + 2')).toBe(undefined);
  });

  test('sloppy by default', () => {
    expect(() => evaluateAsync('with({}){}')).not.toThrow();
  });

  test('accepts arguments mode is supported', async () => {
    expect(await evaluateAsync('return a + b', { a: 1, b: 5 }, true)).toBe(6);
  });

  test('async execution', async () => {
    expect(await evaluateAsync(`
      await new Promise(resolve => setTimeout(resolve, 100));
      return a + b
    `, { a: 1, b: 5 }, true)).toBe(6);
  });
});

describe('#isPrimitive', () => {
  test('returns true for primitive type', () => {
    expect(isPrimitive('d')).toBe(true);
    expect(isPrimitive(2)).toBe(true);
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
    expect(isPrimitive()).toBe(true);
    expect(isPrimitive(Symbol('dd'))).toBe(true);
    expect(isPrimitive(true)).toBe(true);
  });

  test('returns false for non-primitive type', () => {
    /* eslint-disable no-new-wrappers */
    expect(isPrimitive(new String('d'))).toBe(false);
    expect(isPrimitive(new Number(2))).toBe(false);
    expect(isPrimitive(new Boolean(2))).toBe(false);
    /* eslint-enable no-new-wrappers */
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive(() => {})).toBe(false);
  });
});

describe('#isFunction', () => {
  expect(isFunction('[].forEach')).toBe(true);
});

describe('#getFunctionBody', () => {
  test('normal functions', () => {
    function contains() {
      return forEach();
    }

    expect(getFunctionBody(contains)).toBe('{\n    return forEach();\n}');
  });

  test('accepts string (not recommended though)', () => {
    expect(() => {
      getFunctionBody(`() => {
          const arr = [10, 5, 3];
          arr[2];
      }`);
    }).not.toThrow();
  });

  test('arrow functions', () => {
    const arrow = () => {
      const arr = [10, 5, 3];
      arr[2];
    };

    expect(getFunctionBody(arrow)).toMatchSnapshot();
  });

  test('blockless arrow functions', () => {
    const arrow = a => 10 + a;
    expect(getFunctionBody(arrow)).toBe('10 + a');
  })

  test('async arrow functions', () => {
    const a = async () => {
      2 + 2;
    };

    expect(getFunctionBody(a)).toBe('{\n    2 + 2;\n}');
  });

  test('generators', () => {
    const a = function* () {
      yield 10;
    };

    expect(getFunctionBody(a)).toBe('{\n    yield 10;\n}');
  });

  test('iife', () => {
    expect(getFunctionBody((function () {
      2;
    }))).toBe('{\n    2;\n}');
  });
});

describe('#getFunctionParams', () => {
  test('returns array of arguments\' names', () => {
    function contains(str) {
      return forEach(str);
    }

    expect(getFunctionParams(contains)).toEqual(['str']);
  });

  test('returns empty array', () => {
    function contains() {
      return forEach();
    }

    expect(getFunctionParams(contains)).toEqual([]);
  });

  test('doesn\'t fail when non-function is given', () => {
    expect(getFunctionParams('2')).toEqual([]);
  });
});

describe('#isAsyncFunction', () => {
  test('returns true for async functions', () => {
    expect(isAsyncFunction(async () => {})).toBe(true);
    expect(isAsyncFunction(new ((async () => {}).constructor)())).toBe(true);
  });

  test('returns false for literally everything else', () => {
    expect(isAsyncFunction(() => {})).toBe(false);
    // eslint-disable-next-line prefer-arrow-callback
    expect(isAsyncFunction(function x() {})).toBe(false);
    // eslint-disable-next-line no-empty-function
    expect(isAsyncFunction(function* x() {})).toBe(false);
    expect(isAsyncFunction(Function)).toBe(false);
    expect(isAsyncFunction(Promise.prototype.then)).toBe(false);
    expect(isAsyncFunction(2)).toBe(false);
    expect(isAsyncFunction('')).toBe(false);
    expect(isAsyncFunction([])).toBe(false);
    expect(isAsyncFunction()).toBe(false);
  });
});
