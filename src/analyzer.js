import { evaluate, evaluateAsync, getFunctionBody, getFunctionParams } from './utils';
import feedback from './feedback';
import joinPath from './path';

function collectFeedback(argumentsList) {
  return argumentsList.map(feedback);
}

function intercept(ret, _eval, { keys = {}, args = {} } = {}) {
  const obj = {
    path: [],
    access: [],
    calls: 0,
    mapped: {
      * [Symbol.iterator]() {
        const mappedKeys = Object.keys(this);
        while (mappedKeys.length) {
          const key = mappedKeys.shift();
          yield [
            key.replace(/\$\d+/, ''),
            this[key],
          ];
        }
      },
    },
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
      const argsList = new Array(argumentsList.length).fill(feedback(undefined));
      current.access.push('call', argsList);
      if (currentKey !== undefined && current.mapped[currentKey] !== undefined) {
        current.mapped[currentKey].push('call', argsList);
      }
      try {
        // note: we lose (valuable?) feedback here due to missing toJSON() in some objects
        collectFeedback(JSON.parse(JSON.stringify(argumentsList))).forEach((item, i) => {
          argsList[i] = item;
        });
      } catch (ex) {}

      try {
        const ref = _eval(joinPath(current.path));
        if (typeof ref === 'function') {
          const parsedArgs = {};
          getFunctionParams(ref).forEach((name, i) => {
            parsedArgs[name] = argumentsList[i];
          });
          ret.push(...parseKey(getFunctionBody(ref), _eval, { args: parsedArgs }));
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
        current = JSON.parse(JSON.stringify(obj));
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
          // todo: move it outside the closure, no need to allocate this function over and over again...
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
          if (!excluded) {
            if (Object.keys(keys).includes(key)) {
              current.special = keys[key];
            }

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

      if (args[key]) {
        return args[key];
      }

      return instance;
    },
  });

  return instance;
}

export function parseKey(exp, _eval = () => {}, { keys = {}, args = {} } = {}) {
  const ret = [];
  evaluate(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval, { keys, args }),
  });
  return ret;
}

export async function parseKeyAsync(exp, _eval) {
  const ret = [];
  await evaluateAsync(`with(s){\n${exp}\n}`, {
    s: intercept(ret, _eval, {
      follow: true,
      keys: {
        then: 'Promise',
        catch: 'Promise',
      },
    }),
  });

  return ret.map((item) => {
    if (item.special !== 'Promise') {
      return item;
    }

    const { path, access } = item;
    if (path[0] === '_asyncTestExports') {
      path.shift();
      access.splice(1, 1);
    }

    const mapped = { ...item.mapped };
    delete mapped.then; // todo: remove ${index} as well
    delete mapped.catch;

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
      mapped,
    };
  });
}

export function getPath(func, follow) {
  return parseKey(func, this, { follow }).reduce((acc, { path }) => [...acc, path], []);
}

export const getPathAsync = async (func, follow) => (await parseKeyAsync(func, this, { follow }))
  .reduce((acc, { path }) => [...acc, path], []);

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
