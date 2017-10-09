import { evaluate } from './utils';

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

function intercept(ret) {
  const obj = {
    path: [],
    access: [],
    calls: 0,
    fullPath: [],
  };
  let current = null;

  let lastAccessed = '';
  let included = false;
  return chainableProxy({
    apply(target, thisArg, argumentsList) {
      current.fullPath.push(lastAccessed, '(', ...argumentsList, ')');
      current.calls += 1;
      current.access.push('call', argumentsList.length);
      target.apply(thisArg, argumentsList);
    },
    has() {
      current = JSON.parse(JSON.stringify(obj));
      ret.push(current);
      included = false;
      return true;
    },
    get(target, key) {
      if (key === Symbol.unscopables) return [];
      if (key === Symbol.toPrimitive) {
        return function (hint) {
          target.apply(this, arguments); // eslint-disable-line prefer-rest-params
          switch (hint) {
            case 'number':
              return 0;
            case 'string':
              return '';
            default:
              return true;
          }
        };
      }

      if (!included) {
        included = true;
        current.access.push('access');
      } else {
        current.access.push('get');
      }

      lastAccessed = key;
      current.path.push(key);
      current.fullPath.push(key);
    },
  });
}

export function getPath(func) {
  return parseKey(func).reduce((acc, { path }) => {
    if (path.length) {
      acc.push(path);
    }

    return acc;
  }, []);
}

export function isCallable(func, toObserve, all = false) {
  return parseKey(func)
    .filter(({ path }) => toObserve.includes(path.join('.')))
    [all ? 'every' : 'some'](({ calls }) => calls > 0);
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

export const parseKey = (exp) => {
  const ret = [];
  evaluate(`with(s){\n${exp}\n}`, {
    s: intercept(ret),
  });
  return ret;
};

export function listAccesses(code, filter = []) {
  try {
    let parsed = parseKey(code);
    if (filter.length) {
      const paths = filter.reduce((acc, path) => {
        acc.push(...getPath(path).map(item => item.join('.')));
        return acc;
      }, []);

      parsed = parsed.filter(({ path }) => paths.includes(path.join('.')));
    }

    return parsed.reduce((acc, { access }) => {
      if (access.length) {
        acc.push(access);
      }

      return acc;
    }, []);
  } catch (ex) {}

  return [];
}
