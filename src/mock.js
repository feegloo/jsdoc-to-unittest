// concept taken from https://github.com/P0lip/panzerschrank/
const proxy = (target, _eval) => {
  return new Proxy(target, {
    has: () => true,
    get(_, key) {
      if (key === Symbol.unscopables) return [];
      if (key in target) {
        return target[key];
      }

      try {
        return _eval(key);
      } catch(ex) {}
    },
  });
};

const functionMockRegex = /([^(]+)(\()?([^)]*)\)?$/;
const parseKey = key => functionMockRegex.exec(key);

const insert = (obj, path, value, _eval) => {
  const { length } = path;
  const name = path.shift();
  switch (length) {
    case 2: {
      if (!(name in obj)) {
        const ref = { ...obj };
        obj[name] = new Proxy(ref, {
          set(target, key, returnValue) {
            if (target[key]) {
              target[key].push(returnValue);
            } else {
              target[key] = [returnValue];
            }

            target[key].isFunc = target[key].isFunc || returnValue.isFunc;

            return true;
          },

          get(target, key) {
            if (key in target) {
              if (!target[key].isFunc) return target[key][0].value;
              const func = (...args) => {
                const { value } = target[key]
                  .find(({ isFunc, fnArgs }) => isFunc && fnArgs.length === args.length) || {};
                return value;
              };

              return func;
            }

            return ref[key];
          },
        });
      }

      const [, keyName, isFunc, _fnArgs] = parseKey(path.shift());
      const fnArgs = _fnArgs.split(',').filter(item => item.trim().length);
      obj[name][keyName] = { isFunc, fnArgs, value };
      break;
    }

    default:
      Object.assign(obj, { [name]: { ...(obj[name] || {}) } });

      try {
        Object.assign(obj[name], _eval(name));
      } catch (ex) {
      }

      insert(obj[name], path, value, _eval);
  }
};

function mock(func, mocks, _eval) {
  const obj = {};

  for (const [path, value] of Object.entries(mocks)) {
    insert(obj, path.split('.'), value, _eval);
  }

  return Function(
    's',
    `with(s){return(${func.toString()}).apply(this,arguments)}`,
  ).bind(null, proxy(obj, _eval));
}

module.exports = mock;
