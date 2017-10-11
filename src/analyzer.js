import { evaluate } from './utils';

function chainableProxy(handlers) { // fixme: merge to intercept
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
  };
  let current = null;
  let included = false;
  const instance = chainableProxy({
    apply(target, thisArg, argumentsList) {
      if (argumentsList.some(item => item === instance)) {
        ret.pop();
        current = ret[ret.length - 1];
      }

      current.calls += 1;
      current.access.push('call', argumentsList.length);
      target.apply(thisArg, argumentsList);
    },
    construct(target, argumentsList) {
      if (argumentsList.some(item => item === instance)) {
        ret.pop();
        current = ret[ret.length - 1];
      }
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

      current.path.push(key);
      if (!included) {
        included = true;
        current.access.push('access');
      } else {
        current.access.push('get');
      }
    },
  });

  return instance;
}

export const parseKey = (exp) => {
  const ret = [];
  evaluate(`with(s){\n${exp}\n}`, {
    s: intercept(ret),
  });
  return ret;
};

export function getPath(func) {
  return parseKey(func).reduce((acc, { path }) => [...acc, path], []);
}

export function isCallable(func, toObserve, all = false) {
  return parseKey(func)
    .filter(({ path }) => toObserve.includes(path.join('.')))
    [all ? 'every' : 'some'](({ calls }) => calls > 0); // eslint-disable-line no-unexpected-multiline
}

export function fallToGlobal(target, _eval, oldKey = '') {
  return new Proxy(target, {
    has: () => true,
    get(_, key) {
      if (key === Symbol.unscopables) return [];
      if (key === 'arguments') return [];

      if (Reflect.has(target, key)) {
        const newTarget = target[key];
        if (typeof newTarget !== 'object' && typeof newTarget !== 'function') {
          return newTarget;
        }

        return fallToGlobal(newTarget, _eval, `${oldKey}.${key}`);
      }

      try {
        return _eval(`${oldKey}.${key}`.slice(1));
      } catch (ex) {}
    },
  });
}

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

    return parsed.reduce((acc, { access }) => [...acc, access], []);
  } catch (ex) {}

  return [];
}
