import { evaluate, evaluateAsync, getFunctionBody, getFunctionParams, isPrimitive } from './utils';
import feedback, { Types } from './feedback';
import joinPath from './path';
import mockedConsole from '../__mocks__/console';

function intercept(ret, _eval, args = {}, _async = false) {
  const obj = {
    path: [],
    access: [],
    calls: 0,
    mapped: {},
  };
  const seenKeys = new Map();
  let current = null;
  let currentKey = '';
  let included = false;
  let excluded = false;
  const instance = new Proxy(function () {}, { // eslint-disable-line prefer-arrow-callback
    apply(target, thisArg, argumentsList) {
      if (argumentsList.some(item => item === instance)) {
        ret.pop();
        current = ret[ret.length - 1];
      }

      current.calls += 1;
      const argsList = new Array(argumentsList.length);
      for (let i = 0; i < argumentsList.length; i += 1) {
        argsList[i] = feedback(argumentsList[i]);
      }

      const intercepted = ['call', argsList];
      current.access.push(...intercepted);
      if (currentKey !== undefined && current.mapped[currentKey] !== undefined) {
        current.mapped[currentKey].push(...intercepted);
      }

      try {
        const ref = _eval(joinPath(current.path));
        if (typeof ref === 'function') {
          const parsedArgs = {};
          getFunctionParams(ref).forEach((name, i) => {
            parsedArgs[name] = argumentsList[i];
          });
          ret.push(...parseKey(getFunctionBody(ref), _eval, parsedArgs));
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
    has(target, key) {
      if (!Reflect.has(args, key)) {
        current = {
          ...JSON.parse(JSON.stringify(obj)),
          mapped: {
            * [Symbol.iterator]() {
              const mappedKeys = Object.keys(this);
              while (mappedKeys.length) {
                const mappedKey = mappedKeys.shift();
                yield [
                  mappedKey.replace(/\$\d+/, ''),
                  this[mappedKey],
                ];
              }
            },
          },
        };
        ret.push(current);
        seenKeys.clear();
        included = false;
        excluded = false;
      } else {
        excluded = true;
      }
      return true;
    },
    get(target, key) {
      switch (key) {
        case Symbol.unscopables:
          return void 0; // eslint-disable-line no-void
        case Symbol.toPrimitive:
          // todo: move it outside the closure,
          // as there is no need to allocate this function over and over again...
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
          return () => null; // todo as above
        default:
          if (key === '_asyncTestExports') {
            break;
          }

          if (!excluded) {
            current.path.push(key);
            currentKey = key;
            let index = seenKeys.get(currentKey);
            if (index) {
              currentKey = `${currentKey}$${index}`;
            } else {
              index = 0;
            }

            if (!included) {
              included = true;
              current.mapped[currentKey] = ['access'];
              current.access.push('access');
            } else {
              current.mapped[currentKey] = ['get'];
              current.access.push('get');
            }

            seenKeys.set(currentKey, index + 1);
          }
      }

      if (Reflect.has(args, key)) {
        return args[key];
      }

      if (_async && current.access.includes('get') && /then(\$\d*)?/.test(currentKey)) {
        return;
      }

      return instance;
    },
  });

  return instance;
}

export function parseKey(exp, _eval = () => {}, args = {}) {
  const ret = [];
  evaluate(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval, { ...args, Types }),
  });
  return ret;
}

export async function parseKeyAsync(exp, _eval = () => {}, args = {}) {
  const ret = [];
  await evaluateAsync(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval, {
      Promise,
      Types,
      ...args,
    }, true),
  });
  return ret;
}

export function getPath(func) {
  return parseKey(func, this).reduce((acc, { path }) => [...acc, path], []);
}

export const getPathAsync = async (func) => {
  const parsed = await parseKeyAsync(func, this);
  return parsed.reduce((acc, { path }) => [...acc, path], []);
};

export function isCallable(func, filter, all = false) {
  return parseKey(func, this)
    .filter(({ path }) => filter.includes(path.join('.')))
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
  const privateScope = new WeakMap();
  privateScope.set(target, {});
  return new Proxy(target, {
    has: () => true,
    set(_, key, value) {
      if (key === 'args') {
        mappedArgs.set(target, value);
      } else {
        privateScope.get(target)[key] = value;
      }

      return true;
    },
    get(_, key) {
      if (key === '_asyncTestExports') { // fixme: that _asyncTestExports
        return fallToGlobal(target, _eval);
      }

      if (key === Symbol.unscopables) return null;
      if (key === 'arguments') {
        return mappedArgs.get(target) || [];
      }

      const scope = privateScope.get(target);
      if (key in scope) {
        return scope[key];
      }

      if (!isPrimitive(target) && Reflect.has(target, key)) {
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
      acc.push(...parseKey(path));
      return acc;
    }, []);

    parsed = parsed.map((obj) => {
      const { mapped } = obj;
      const keyedMapped = Object.keys(mapped);
      let max = -1;
      let foundObj;
      paths.forEach(({ mapped: filterMapped }) => {
        Object.keys(filterMapped).every((key, i) => {
          if (key === keyedMapped[i]) {
            if (i > max) {
              max = i;
              foundObj = obj;
            }
            return true;
          }


          return false;
        });
      });


      return foundObj;
    }).filter(item => item);
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

export async function useConsoleLog(code, filter) {
  const logs = [];
  await evaluateAsync(code, {
    console: mockedConsole.revokable(logs),
  });
  return logs.length > 0;
}
