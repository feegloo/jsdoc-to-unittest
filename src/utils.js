import escodegen from 'escodegen';
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';

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

export function wrap(src, mocks, mockName = 'mock') {
  if (typeof src !== 'string') {
    return '';
  }

  if (validateSyntax(src).ex !== null) {
    return '';
  }

  const stripped = stripComments(src);
  const strippedSemicolons = stripSemicolons(stripped);

  if (isFunction(strippedSemicolons, this)) {
    return mocks ? `${mockName}(${strippedSemicolons}, ${mocks}, func => eval(func))` : strippedSemicolons;
  }

  if (!/[\n;]/.test(strippedSemicolons)) {
    return mocks ? `${mockName}(() => ${strippedSemicolons}, ${mocks}, func => eval(func))` : strippedSemicolons;
  }

  return mocks ? `${mockName}(() => eval(\`${src}\`), ${mocks}, func => eval(func))` : `eval(\`${src}\`)`;
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

const astCache = new class extends WeakMap {
  get(target) {
    if (isPrimitive(target)) {
      return acorn.parse(target);
    }

    let ast = super.get(target);
    if (ast !== undefined) {
      return ast;
    }

    ast = acorn.parse(target);
    this.set(target, ast);
    return ast;
  }
};

export { astCache };

export function getFunctionBody(func) {
  const nodes = [];
  walk.simple(astCache.get(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
  });

  return escodegen.generate(nodes[0].body);
}

export function getFunctionParams(func) {
  const nodes = [];
  walk.simple(astCache.get(func), {
    FunctionDeclaration(node) {
      nodes.push(node);
    },
  });

  return nodes.length && nodes[0].params !== undefined ? nodes[0].params.map(item => item.name) : [];
}
