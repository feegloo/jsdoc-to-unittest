import escodegen from 'escodegen';
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';
import cache from './cache';

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

  const stripped = stripComments(src);
  const strippedSemicolons = stripSemicolons(stripped);

  if (!strippedSemicolons.length) {
    return '';
  }

  if (isFunction(strippedSemicolons, this)) {
    return mocks ? `${mockName}(${strippedSemicolons}, ${mocks}, ${evalFunc})` : strippedSemicolons;
  }

  const ast = cache.ast.get(src);
  if (ast.body.length === 1 &&
    ast.body[0].type === 'ExpressionStatement' &&
    ast.body[0].expression.type === 'CallExpression'
  ) {
    const strippedSrc = stripSemicolons(stripComments(src));
    return mocks ? `${mockName}(() => ${strippedSrc}, ${mocks}, ${evalFunc})` : strippedSrc;
  }

  return mocks ? `${mockName}(${src}, ${evalFunc}), ${mocks}, ${evalFunc})` : `evaluate(() => { ${stripComments(src)} }, ${evalFunc})`;
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

export function getFunctionBody(func) {
  const nodes = [];
  walk.simple(cache.ast.get(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
    ArrowFunctionExpression(node) {
      nodes.push(node);
    },
  });

  if (nodes.length && nodes[0].body !== undefined) {
    return escodegen.generate(nodes[0].body);
  }

  if (typeof func === 'function') {
    return Reflect.apply(Function.toString, func, []);
  }

  return func;
}

export function getFunctionParams(func) {
  const nodes = [];
  walk.simple(cache.ast.get(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
  });

  if (nodes.length && nodes[0].params !== undefined) {
    return nodes[0].params.map(item => item.name);
  }

  return [];
}
