import { assertAccess } from './utils';

function chainableProxy(handlers) {
  const traps = {};
  let instance;
  for (const [trap, func] of Object.entries(handlers)) {
    traps[trap] = (...args) => { // eslint-disable-line no-loop-func
      try {
        const ret = func(...args);
        if (ret !== undefined) return ret;
      } catch (ex) {}
      return instance;
    };
  }

  instance = new Proxy(chainableProxy, traps);
  return instance;
}

function intercept(path, called = [], firstKey = '') {
  const localPath = firstKey !== '' ? [firstKey] : [];
  let included = false;
  return chainableProxy({
    apply(target, thisArg, argumentsList) {
      called.push(localPath);
      return target.apply(thisArg, argumentsList);
    },
    get(target, prop) {
      if (!included) {
        included = true;
        path.push(localPath);
      }

      localPath.push(prop);
    },
  });
}

function withProxy(found, called) {
  return chainableProxy({
    has: () => true,
    get(target, key) {
      if (key === Symbol.unscopables) return [];
      return intercept(found, called, key);
    },
  });
}

export function getPath(func, args = ['easy', 'frosmo']) {
  const path = [];
  Function(args.join(','), func)(...args.map(() => intercept(path)));
  return path;
}

export function isCallable(func, toObserve, all = false) {
  const found = [];
  const called = [];
  Function(
    's',
    `with(s){return(()=>{\n${func}\n})()}`,
  )(withProxy(found, called));

  const foundObserved = found.filter(item => toObserve.includes(item.join('.')));
  const calledObserved = called.filter(item => toObserve.includes(item.join('.')));

  return calledObserved.length > 0 && (!all || foundObserved.length === calledObserved.length);
}

function getFromScope(path, _eval, defaults) {
  try {
    return _eval(path);
  } catch (ex) {
    if (!(ex instanceof SyntaxError)) {
      return defaults;
    }
  }
}

export function fallToGlobal(target, _eval, oldKey = '') {
  return new Proxy(target, {
    has: () => true,
    get(_, key) {
      if (key === Symbol.unscopables) return [];
      if (key === 'arguments') return [];

      if (Reflect.has(target, key)) {
        const newTarget = target[key];
        if (typeof newTarget !== 'object') {
          return newTarget;
        }

        return fallToGlobal(newTarget, _eval, `${oldKey}.${key}`);
      }

      return getFromScope(`${oldKey}.${key}`.slice(1), _eval);
    },
  });
}

const functionMockRegex = /([^(]+)(\()?([^)]*)\)?$/;

export const parseKey = (key) => {
  const [, name, isCalled, args] = functionMockRegex.exec(key);
  const firstKey = /^[^.[)]+/.exec(key);

  const [fullPath = []] = getPath(key, firstKey);
  const path = new Array(fullPath.length).fill('get');
  if (isCalled === '(') {
    path.push('call');
  }

  return {
    key: name,
    path: ['access', ...path],
    fullPath: [firstKey[0], ...fullPath],
    isCalled: isCalled === '(',
    args: args.split(/[,\s]*/).length,
  };
};

export function listAccesses(code, path) {
  const obj = {};
  const accesses = [];
  path.split('.').reduce((acc, key, i, arr) => {
    [, key] = functionMockRegex.exec(key);
    if (arr.length === i + 1) {
      Object.defineProperty(acc, key, {
        enumerable: true,
        get() {
          const actions = new Array(arr.length - 1).fill('get'); // fixme too naive, doesn't contain calls
          accesses.push(actions);
          return (...args) => {
            actions.push('call', args.length);
          };
        },
      });

      return null;
    }

    acc[key] = {};
    return acc[key];
  }, obj);

  try {
    Function(
      's',
      `with(s){\n${code}\n}`,
    )(assertAccess(obj));
  } catch (ex) {}

  return accesses;
}
