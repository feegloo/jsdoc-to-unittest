import { listAccesses, parseKey, fallToGlobal, parseKeyAsync, listAccessesAsync } from './analyzer';
import { AsyncFunction } from './utils';

function mocker(cur, { async, fullPath, accesses, accessPath, value, ...rest }) {
  fullPath.forEach((key, i, arr) => {
    if (arr.length === i + 1) {
      const values = new Array(accesses.length).fill({});
      Reflect.defineProperty(cur, key, {
        enumerable: true,
        set(_value) {
          const toCompare = [..._value.access].join('');

          const index = accesses.findIndex(item => item.join('') === toCompare);
          if (index === -1) {
            return false;
          }

          values[index] = _value;
          return true;
        },
        get() {
          const { value: _value, calls } = values.shift();
          if (calls && typeof _value !== 'function') {
            if (async) {
              return () => Promise.resolve(_value);
            }

            return () => _value;
          }

          return _value;
        },
      });

      cur[key] = { access: accessPath, value, ...rest };
    } else if (key in cur) {
      cur = cur[key];
    } else {
      const ref = cur[key] = () => ref; // eslint-disable-line no-multi-assign
      cur = cur[key];
    }
  });
}

function createFunction(Constructor, func, obj, _eval) {
  const [firstAccess, ...rest] = listAccesses.call(_eval, func);
  if (firstAccess && rest && rest.length === 0) {
    if (firstAccess.length > 2 && Array.isArray(firstAccess[firstAccess.length - 1])) {
      return Constructor(
        's',
        `with(s){return(${func.toString()});}`,
      ).call(null, fallToGlobal(obj, _eval));
    }
  }

  return Constructor(
    's',
    `with(s){return(${func.toString()}).apply(this,arguments)}`,
  ).call(null, fallToGlobal(obj, _eval));
}

export default function mock(func, mocks, _eval) {
  const obj = {};

  for (const [path, value] of Object.entries(mocks)) {
    const [{ path: fullPath, access: accessPath, ...rest }] = parseKey(path, _eval);
    const accesses = listAccesses.call(_eval, func, [path]);
    if (!accesses.length) {
      accesses.push(
        ...listAccesses.call(_eval, `(${func.toString()})()`, [path]),
      );
    }

    mocker(obj, {
      async: false,
      accesses,
      accessPath,
      value,
      fullPath,
      ...rest,
    });
  }

  return createFunction(Function, func, obj, _eval);
}

mock.async = async function (func, mocks, _eval) {
  const obj = {};

  for (const [path, value] of Object.entries(mocks)) {
    const accesses = await listAccessesAsync.call(_eval, `(${func.toString()})()`, [path]);
    const [{ path: fullPath, access: accessPath, ...rest }] = await parseKeyAsync(path, _eval);
    mocker(obj, {
      async: true,
      accesses,
      accessPath,
      value,
      fullPath,
      ...rest,
    });
  }

  return createFunction(AsyncFunction, func, obj, _eval);
};
