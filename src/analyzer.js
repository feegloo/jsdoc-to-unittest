import { evaluate, evaluateAsync } from './utils';

function collectFeedback(argumentsList) {
  return argumentsList.map(value => ({
    value,
    type: typeof value,
  }));
}

function intercept(ret, _eval, keys = {}) {
  const obj = {
    path: [],
    access: [],
    feedback: [],
    calls: 0,
  };
  let current = null;
  let included = false;
  const instance = new Proxy(function () {}, {
    apply(target, thisArg, argumentsList) {
      if (argumentsList.some(item => item === instance)) {
        ret.pop();
        current = ret[ret.length - 1];
      }

      current.calls += 1;
      current.access.push('call', argumentsList.length);
      try {
        current.feedback.push(...collectFeedback(JSON.parse(JSON.stringify(argumentsList))));
      } catch (ex) {}

      try {
        const ref = _eval(current.path.join('.'));
        if (typeof ref === 'function') {
          ret.push(...parseKey(`(${ref})()`, _eval));
        }
      } catch (ex) {}
      return instance;
    },
    construct(target, argumentsList) {
      if (argumentsList.some(item => item === instance)) {
        ret.pop();
        current = ret[ret.length - 1];
      }
      return instance;
    },
    has() {
      current = JSON.parse(JSON.stringify(obj));
      ret.push(current);
      included = false;
      return true;
    },
    get(target, key) {
      switch (key) {
        case Symbol.unscopables:
          return [];
        case Symbol.toPrimitive:
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
        case 'toJSON':
          return () => null;
        default:
          if (Object.keys(keys).includes(key)) {
            current.special = keys[key];
          }

          current.path.push(key);
          if (!included) {
            included = true;
            current.access.push('access');
          } else {
            current.access.push('get');
          }
      }

      return instance;
    },
  });

  return instance;
}

export function parseKey(exp, _eval = () => {}) {
  const ret = [];
  evaluate(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval),
  });
  return ret;
}

export async function parseKeyAsync(exp, _eval) {
  const ret = [];
  await evaluateAsync(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval, {
      then: 'Promise',
      catch: 'Promise',
    }),
  });
  return ret.map((item) => {
    if (item.special !== 'Promise') {
      return item;
    }

    const { path, access, calls } = item;
    const firstThenIndex = path.indexOf('then');
    path.splice(firstThenIndex, path.length);
    const mergedAccess = access.reduce((acc, cur) => {
      if (cur === 'access') {
        acc.push([cur]);
      } else if (cur === 'get') {
        acc.push([cur]);
      } else {
        acc[acc.length - 1].push(cur);
      }

      return acc;
    }, []);
    mergedAccess.splice(firstThenIndex, mergedAccess.length);
    const concat = mergedAccess.reduce((acc, cur) => [...acc, ...cur], []);

    return {
      ...item,
      access: concat,
      calls: concat.reduce((acc, cur) => {
        if (cur === 'call') {
          return acc + 1;
        }

        return acc;
      }, 0),
      path,
    };
  });
}

export function getPath(func) {
  return parseKey(func, this).reduce((acc, { path }) => [...acc, path], []);
}

export function isCallable(func, toObserve, all = false) {
  return parseKey(func, this)
    .filter(({ path }) => toObserve.includes(path.join('.')))
    [all ? 'every' : 'some'](({ calls }) => calls > 0); // eslint-disable-line no-unexpected-multiline
}

function sandbox(func) {
  return Function(
    's, ...args',
    `s.args=args;with(s){return(${func.toString()}).apply(this,arguments)}`,
  );
}

export function fallToGlobal(target, _eval, oldKey = '') {
  const mappedArgs = new WeakMap();
  return new Proxy(target, {
    has: () => true,
    set(_, key, value) {
      if (key === 'args') {
        mappedArgs.set(target, value);
      }

      return true;
    },
    get(_, key) {
      if (key === Symbol.unscopables) return [];
      if (key === 'arguments') {
        return mappedArgs.get(target) || [];
      }

      if (Reflect.has(target, key)) {
        const newTarget = target[key];
        if (typeof newTarget !== 'object' && typeof newTarget !== 'function') {
          return newTarget;
        }

        return fallToGlobal(newTarget, _eval, `${oldKey}.${key}`);
      }

      try {
        let func;
        if (oldKey) {
          func = _eval(`${oldKey}.${key}`.replace('.', ''));
        } else {
          func = _eval(key);
        }

        if (typeof func === 'function') {
          return sandbox(func).bind(null, fallToGlobal(target, _eval, `${oldKey}.${key})`));
        }

        return func;
      } catch (ex) {}
    },
  });
}

function filterAccesses(parsed, filter) {
  if (filter.length) {
    const paths = filter.reduce((acc, path) => {
      acc.push(...getPath(path).map(item => item.join('.')));
      return acc;
    }, []);

    parsed = parsed.filter(({ path }) => paths.includes(path.join('.')));
  }

  return parsed.reduce((acc, { access }) => [...acc, access], []);
}

export function listAccesses(code, filter = []) {
  try {
    return filterAccesses(parseKey(code, this), filter);
  } catch (ex) {
    return [];
  }
}

export async function listAccessesAsync(code, filter = []) {
  try {
    return filterAccesses(await parseKeyAsync(code, this), filter);
  } catch (ex) {
    return [];
  }
}
