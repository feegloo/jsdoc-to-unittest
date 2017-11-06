import * as babel from 'babel-core';
import escodegen from 'escodegen';
import * as walk from 'acorn/dist/walk';
import { acorn } from './cache';

export function evaluate(code, args = {}, strict = false) {
  return Function(Object.keys(args).join(','), `${strict ? '\'use strict\';' : ''}${code}`)(...Object.values(args));
}

export const AsyncFunction = (async () => {}).constructor;

export async function evaluateAsync(code, args = {}, strict = false) {
  return AsyncFunction(Object.keys(args).join(','), `${strict ? '\'use strict\';' : ''}${code}`)(...Object.values(args));
}

export const isAsyncFunction = func => typeof func === 'function' && func instanceof AsyncFunction;

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

const semicolons = /^[\s;]+|[\s*;]+$/g;

export const stripSemicolons = str => str.replace(semicolons, '');

export const stripComments = (str) => {
  try {
    return escodegen.generate(acorn.parse(str), {
      format: {
        indent: {
          style: '  ',
          base: 0,
          adjustMultilineComment: false,
        },
      },
    });
  } catch (ex) {
    return str;
  }
};

const evalFunc = 'func => eval(func)';

export function wrap(src, mocks, mockName = 'mock') {
  if (typeof src !== 'string') {
    return '';
  }

  if (validateSyntax(src).ex !== null) {
    return '';
  }

  src = stripSemicolons(stripComments(src));

  if (!src.length) {
    return '';
  }

  src = String(src).replace(/`/g, '\\`');

  const ast = acorn.parse(src);
  if (ast.body.length === 1 && ast.body[0].type === 'ExpressionStatement') {
    return mocks ? `${mockName}(() => ${src}, ${mocks}, ${evalFunc})` : src;
  }

  ({ code: src } = babel.transform(`() => { ${src} }`, {
    plugins: ['implicit-return'],
  }));

  src = stripSemicolons(src);

  if (mocks) {
    return `${mockName}(${src}, ${mocks}, ${evalFunc})`;
  }

  return src;
}

export const isPrimitive = sth => sth === null || (typeof sth !== 'object' && typeof sth !== 'function');

export const assertAccess = target => new Proxy(() => {}, {
  has: () => true,
  get(_, key) {
    if (key === Symbol.unscopables) return null;

    if (!isPrimitive(target) && Reflect.has(target, key)) {
      const value = target[key];
      if (isPrimitive(value)) {
        return value;
      }

      if (typeof value === 'function') {
        return function () {
          try {
            // eslint-disable-next-line prefer-rest-params
            return assertAccess(value.apply(this, arguments));
          } catch (ex) {}
        };
      }

      return assertAccess(value);
    }

    return assertAccess({});
  },
});

export function getFunctionBody(func, includeBlock = true) {
  const nodes = [];
  walk.simple(acorn.parse(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
    FunctionExpression(node) {
      nodes.push(node);
    },
    ArrowFunctionExpression(node) {
      nodes.push(node);
    },
  });

  if (nodes.length && nodes[0].body !== undefined) {
    let node = nodes[0].body;
    if (!includeBlock) {
      while (node.type === 'BlockStatement' && node[0] !== undefined) {
        node = node[0].body;
      }
    }

    return escodegen.generate(node);
  }

  if (typeof func === 'function') {
    return Reflect.apply(Function.toString, func, []);
  }

  return func;
}

export function getFunctionParams(func) {
  const nodes = [];
  walk.simple(acorn.parse(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
  });

  if (nodes.length && nodes[0].params !== undefined) {
    return nodes[0].params.map(item => item.name);
  }

  return [];
}
