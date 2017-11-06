import * as babel from 'babel-core';
import { Types } from './feedback';
import { parseKey, fallToGlobal, parseKeyAsync } from './analyzer';
import { AsyncFunction, isFunction } from './utils';

function createFunction(Constructor, func, obj, _eval) { // todo: move it to wrap
  let code = String(func).replace(/`/g, '\\`');
  if (typeof func !== 'function') {
    func = String(`() => {
      ${code};
    }`);
  }

  ({ code } = babel.transform(func, {
    plugins: ['implicit-return'],
  }));

  return Constructor(
    's',
    `with(s){ return (${code.replace(/;$/, '')})() }`,
  ).call(null, fallToGlobal(obj, _eval));
}

function mocker(obj, mocks) {
  if (!mocks.length) {
    return obj;
  }

  const { path, value } = mocks.shift();
  let current = obj;
  path.forEach((part, i, arr) => {
    if (arr.length === i + 1) {
      Reflect.defineProperty(current, part, {
        enumerable: true,
        configurable: true,
        get() {
          try {
            mocker(obj, mocks);
          } catch (ex) {}
          return value;
        },
      });
    } else {
      const ref = current[part] = () => ref; // eslint-disable-line no-multi-assign
      current = current[part];
    }
  });
}

export default function mock(func, mocks, _eval) {
  const src = isFunction(func) ? `(${func})()` : String(func);

  const info = parseKey(src, _eval, { Types });
  const mappedMocks = {};
  Object.entries(mocks).forEach(([key, value]) => {
    const { path, access } = parseKey(key)[0];
    mappedMocks[path + JSON.stringify(access)] = value;
  });

  const matched = info
    .map(({ path, access, mapped }) => {
      let found = mappedMocks[path + JSON.stringify(access)];

      if (!found) {
        const clonedMapped = [...mapped];
        const met = {
          path: [],
          access: [],
        };
        while (clonedMapped.length) {
          const map = clonedMapped.shift();

          met.path.push(map[0]);
          met.access.push(...map[1]);
          found = mappedMocks[met.path + JSON.stringify(met.access)];
          if (found) {
            ({ path } = met);
            break;
          }
        }
      }

      return ({
        path,
        value: found,
      });
    })
    .filter(obj => obj.value !== undefined);

  const obj = {};
  mocker(obj, matched);
  return createFunction(Function, func, obj, _eval);
}

mock.async = async function (func, mocks, _eval) { // fixme: copy/paste, merge it
  const src = isFunction(func) ? `(${func})()` : String(func);

  const info = await parseKeyAsync(src, _eval, { Types });
  const mappedMocks = {};
  await Promise.all(Object.entries(mocks).map(async ([key, value]) => {
    const [{ path, access }] = (await parseKeyAsync(mock, _eval, { Types }));
    mappedMocks[path + JSON.stringify(access)] = value;
  }));

  const matched = info
    .map(({ path, access, mapped }) => {
      let found = mappedMocks[path + JSON.stringify(access)];

      if (!found) {
        const clonedMapped = [...mapped];
        const met = {
          path: [],
          access: [],
        };
        while (clonedMapped.length) {
          const map = clonedMapped.shift();

          met.path.push(map[0]);
          met.access.push(...map[1]);
          found = mappedMocks[met.path + JSON.stringify(met.access)];
          if (found) {
            ({ path } = met);
            break;
          }
        }
      }

      return ({
        path,
        value: found,
      });
    })
    .filter(obj => obj.value !== undefined);

  const obj = {};
  mocker(obj, matched);
  return createFunction(AsyncFunction, func, obj, _eval);
};
