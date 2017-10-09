import { parseKey } from './analyzer';

export function toResult(str) {
  return str.replace(/^[;]*|[;]*$/g, '');
}

export function evaluate(code, args = {}, strict = false) {
  return Function(Object.keys(args).join(','), `${strict ? '\'use strict\';' : ''}${code}`)(...Object.values(args));
}

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

function isFunction(str) {
  try {
    return typeof evaluate(`return (${str})`) === 'function';
  } catch (ex) {}

  return false;
}

const reg = /[\n;]/;

export const stripComments = str => str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

function buildPath({ path, access }) {
  let str = '';
  access.shift();

  path.forEach((part, i) => {
    if (isNaN(Number(part))) {
      str += (i === 0 ? '' : '.');
      str += part;
    } else {
      str += (i === 0 ? '' : '[\'');
      str += part;
      str += (i === 0 ? '' : '\']');
    }

    const type = access.shift();
    if (type === 'call') {
      access.shift();
      str += '()';
    }
  });

  return str;
}

export function wrap(src, withMock) { // todo: handle primitive returns
  if (isFunction(src)) {
    return withMock ? `mock(() => ${src})` : src;
  }

  if (validateSyntax(src).ex !== null) {
    return '';
  }

  const paths = parseKey(src);
  if (paths.length === 1) {
  //  return withMock ? `mock(() => ${buildPath(paths[0])})` : buildPath(paths[0]);
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
        return withMock ? `mock(${wrappedFunc})` : wrappedFunc;
      }

    }

    const joined = lines.join('').replace(/;*$|\/{2,}.*$/g, '').trim();
    return withMock ? `mock(() => ${joined})` : joined;
  }

  const formattedSrc = src.replace(/;*$|\/{2,}.*$/g, '').trim();
  return withMock ? `mock(() => ${formattedSrc})` : formattedSrc;
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
            // eslint-disable-next-line prefer-rest-params
            return value.apply(this, arguments); // todo: propagate assertAccess further?
          } catch (ex) {}
        };
      }

      return assertAccess(value);
    }

    return assertAccess({});
  },
});
