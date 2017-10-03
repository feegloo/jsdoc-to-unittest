const { wrap } = require('./utils');

exports.createExports = function createExports(exports) {
  return [
    exports.map(func => `export ${func}`).join('\n\n'),
    `const defaults = (function proxy() {
    return new Proxy(global, {
      get(target, prop) {
        try {
          return eval(prop);
        } catch (ex) {
          if (ex instanceof ReferenceError) {
            return proxy();
          }
        }
      },
    });
  })();

  export default defaults;`].join('\n');
};

exports.createImports = function createImports(imports, filename = '') {
  if (filename === '') return '';
  return `import frosmo, {
    ${imports.map(name => name).join(',\n')}
  } from '${filename}';
  `;
};

function to({ type, result }) {
  switch (type) {
    case 'instance':
      return `toBeInstanceOf(${result}); // fixme: should be replaced with something more specific`;
    case 'value':
      return `toBe(${result});`;
    default:
      return `toEqual(${result});`;
  }
}

exports.to = to;

function printError({ name, ex, code }) {
  return `test('${name}', () => {
    /* fixme add/fix tests
    ${ex}
    ${code} */
  })`;
}

function createTestItem({ name, code, type, result }) {
  const test = `test('${name}', () => {
    expect(${wrap(code)}).${to({ type, result })}
  });`;

  try {
    Function(test)();
  } catch (ex) {
    if (ex instanceof SyntaxError) {
      return printError({ name, ex, code: test });
    }
  }

  return test;
}

const createTest = ({ name, examples }) => `
  describe('${name}', () => {
    ${examples.map((args, i) => createTestItem({ ...args, name: `example ${i + 1}` })).join('\n\n')}
  });
`;

exports.createTest = createTest;

exports.default = suites => suites
  .map(({ examples, name, member }) => {
    if (examples.length) {
      return createTest({
        name: name || examples[0].name,
        member,
        examples,
      });
    }

    return '';
  })
  .filter(code => code.length > 0)
  .join('');
