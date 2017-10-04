export function toResult(str) {
  return str.replace(/^[;]*|[;]*$/g, '');
}

export function validateSyntax(code) {
  try {
    Function(`'use strict';${code}`)();
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

function isFunction(str) {
  try {
    return typeof Function(`return (${str})`)() === 'function';
  } catch (ex) {}

  return false;
}

const reg = /[\n;]/;

export const stripComments = str => str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

export function wrap(src, withMock) {
  if (isFunction(src)) {
    return withMock ? `mock(() => ${src})` : src;
  }

  try {
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
          return withMock ? `mock(${wrappedFunc})` : wrappedFunc;
        }

        return withMock ? `mock(() => { ${src} })` : `() => { ${src} }`;
      }

      const joined = lines.join('').replace(/;*$|\/{2,}.*$/g, '').trim();
      return withMock ? `mock(() => ${joined})` : joined;
    }

    const formattedSrc = src.replace(/;*$|\/{2,}.*$/g, '').trim();
    return withMock ? `mock(() => ${formattedSrc})` : formattedSrc;
  } catch (ex) {
    return '';
  }
}

export const isPrimitive = sth => typeof sth !== 'object' && typeof sth !== 'function';

export const assertAccess = target => new Proxy(() => {}, {
  has: () => true,
  get(_, key) {
    if (key === Symbol.unscopables) return [];

    if (Reflect.has(target, key)) {
      const value = target[key];
      if (isPrimitive(value)) {
        return value;
      }

      if (typeof value === 'function') {
        return function () {
          try {
            return value.apply(this, arguments); // todo: propagate assertAccess further?
          } catch (ex) {}
        };
      }

      return assertAccess(value);
    }

    return assertAccess({});
  },
});
