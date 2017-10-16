// import { parseKey } from './analyzer';

export function toResult(str) {
  return str.replace(/^[;]*|[;]*$/g, '');
}

export function evaluate(code, args = {}, strict = false) {
  return Function(Object.keys(args).join(','), `${strict ? '\'use strict\';' : ''}${code}`)(...Object.values(args));
}

export const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

export async function evaluateAsync(code, args = {}, strict = false) {
  return AsyncFunction(Object.keys(args).join(','), `${strict ? '\'use strict\';' : ''}${code}`)(...Object.values(args));
}

export const isAsyncFunction = func => !isPrimitive(func) && func instanceof AsyncFunction;

export function validateSyntax(code) {
  try {
    evaluate(code, {}, true);
  } catch (ex) {
    if (ex instanceof SyntaxError) {
      return {
        ex,
      };
    }
  }

  return {
    ex: null,
  };
}

export function isFunction(str, scope = {}) {
  try {
    return typeof evaluate(`return (${str})`, scope) === 'function';
  } catch (ex) {}

  return false;
}

const reg = /[\n;]/;

export const stripComments = str => str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

export function wrap(src, mocks) { // todo: handle primitive returns
  if (typeof src !== 'string') {
    return '';
  }

  if (isFunction(src, this)) {
    return mocks ? `mock(${src}, ${mocks})` : src;
  }

  if (validateSyntax(src).ex !== null) {
    return '';
  }

  if (reg.test(src)) {
    const lines = src.split(reg)
      .map(stripComments)
      .filter(item => item.trim().length);
    if (lines.length > 1) {
      const wrappedFunc = `() => {
        ${lines.slice(0, lines.length - 1).join(';\n')};
        return (${toResult(lines[lines.length - 1])});
      }`;
      if (!validateSyntax(wrappedFunc).ex) {
        return mocks ? `mock(${wrappedFunc}, ${mocks})` : wrappedFunc;
      }
    }

    const joined = lines.join('').replace(/;*$|\/{2,}.*$/g, '').trim();
    return mocks ? `mock(() => ${joined}, ${mocks})` : joined;
  }

  const formattedSrc = src.replace(/;*$|\/{2,}.*$/g, '').trim();
  return mocks ? `mock(() => ${formattedSrc}, ${mocks})` : formattedSrc;
}

export const isPrimitive = sth => sth === null || (typeof sth !== 'object' && typeof sth !== 'function');

export const assertAccess = target => new Proxy(() => {}, {
  has: () => true,
  get(_, key) {
    if (key === Symbol.unscopables) return [];

    if (!isPrimitive(target) && Reflect.has(target, key)) {
      const value = target[key];
      if (isPrimitive(value)) {
        return value;
      }

      if (typeof value === 'function') {
        return function () {
          try {
            // eslint-disable-next-line prefer-rest-params
            console.log('x', ...arguments)
            return assertAccess(value.apply(this, arguments));
          } catch (ex) {}
        };
      }

      return assertAccess(value);
    }

    return assertAccess({});
  },
});
