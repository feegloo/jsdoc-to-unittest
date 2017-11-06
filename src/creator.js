import prettify from './prettifier';
import parse from './parser';
import { wrap, validateSyntax, evaluate } from './utils';
import { readFileAsync, writeFileAsync, toStdout } from './fs';
import constants from './constants';

class TestItem {
  constructor({
    async,
    name,
    code,
    type,
    result,
    imports,
    mocks,
    target,
  }) {
    this.async = async;
    this.name = name;
    this.code = code;
    this.type = type;
    this.result = result;
    this.imports = imports;
    this.target = target;
    this.mocks = JSON.stringify(mocks);
    this.mockName = async === 2 ? 'mock.async' : 'mock';
    this.valid = false;
    this.output = this.print();
  }

  printName(code) {
    return `${this.target.method}('${this.name}', ${this.async > 0 ? 'async ' : ''}() => {
      ${code}
    })`;
  }

  renderEquality() {
    if (this.type !== 'no-throw' && typeof this.result === 'string' && !this.result.length) {
      this.type = 'no-throw';
      return this.renderEquality();
    }

    switch (this.type) {
      case 'console':
        return `toHaveLog([${this.result}])`;
      case 'instance':
        return `toBeOneInstanceOf(${JSON.stringify(this.result)}); // fixme: could be replaced with something more specific`;
      case 'value':
        return `toBe(${this.result});`;
      case 'no-throw':
        return 'not.toThrow(); // fixme: could be replaced with something more specific';
      default:
        return `toEqual(${this.result});`;
    }
  }

  print() {
    if (this.type !== 'no-throw') {
      try {
        evaluate(this.renderEquality(), {
          toBe() {},
          toEqual() {},
          toHaveLog() {},
          toBeOneInstanceOf() {},
        });
      } catch (ex) {
        this.type = 'no-throw';
      }
    }

    const wrapped = wrap(this.code, this.mocks, this.mockName);
    const code = `expect(${this.async > 0 ? 'await ' : ''}${wrapped}).${this.renderEquality()}`;
    const test = this.printName(code);

    if (!wrapped.length) {
      return this.printError({ ex: new SyntaxError('Empty expect'), code });
    }

    const { ex } = validateSyntax(test);
    if (ex) {
      return this.printError({ ex, code });
    }

    this.valid = true;
    return test;
  }

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'string':
        return this.output;
      /* istanbul ignore next */
      default:
        return Object.prototype.toString.call(this);
    }
  }

  printError({ ex, code }) {
    return this.printName(`throw new ${ex.constructor.name}('${ex.message}');\n/*${code}*/`);
  }
}

class Test {
  constructor({
    output = '',
    stdout,
    samples,
    imports,
    exports,
    exportsFileName,
    async,
    globals = [],
    inline,
    header,
    footer,
    partials = [],
    target,
  }) {
    this.filename = output;
    this.exportsFileName = exportsFileName;
    this.stdout = stdout;
    this.samples = samples;
    this.imports = imports;
    this.exports = exports;
    this.partials = partials;
    this.async = async;
    this.inline = inline;
    this.header = header;
    this.footer = footer;
    this.target = target;
    this.globals = [...new Set(['mock', 'evaluate', ...globals])].join(', ');
    this.stats = {
      total: 0,
      valid: 0,
    };
  }

  printImports() {
    if (this.stdout || this.inline || !this.imports.length) return '';
    return `import __imports__, {
       ${this.imports.join(',\n')}
      } from './${this.exportsFileName}';
      
      global.__imports__ = __imports__;
      Object.assign(global, __imports__);
      `;
  }

  printPartials() {
    return Promise.all(this.partials.map(partial => readFileAsync(partial)));
  }

  printExports() {
    if (!this.imports.length) {
      return '';
    }

    return prettify([
      this.stdout ? `/* global ${this.globals} */` : '',
      this.stdout ? this.printStats() : '',
      this.exports.map(func => `export ${func}`).join('\n\n'),
      ';',
      `export default { ${this.imports.join(',\n')} };`,
    ].join('\n'));
  }

  printSample({ examples, name = (examples[0] || []).name }) {
    if (!examples.length) return '';
    const tests = examples.map((args, i) => {
      const item = new TestItem({
        async: this.async,
        imports: this.imports,
        target: this.target,
        ...args,
        name: `example ${i + 1}`,
      });
      this.stats.total += 1;
      if (item.valid) {
        this.stats.valid += 1;
      }
      return String(item);
    }).join('\n\n');

    return `describe('${name}', ${this.async ? 'async ' : ''}() => {
      ${tests}
    });`;
  }

  printStats() {
    if (this.stats.valid === 0) {
      return '// Valid tests: 0%';
    }

    return `// Valid tests: ${((this.stats.valid / this.stats.total) * 100).toFixed(2)}%`;
  }

  printGlobals() {
    return `/* global ${this.globals} */`;
  }

  async print() {
    const samples = this.samples.map(this.printSample, this).join('\n');
    if (!samples.length) {
      return '';
    }

    return prettify([
      this.stdout && !this.inline ? await this.printExports() : '',
      this.printGlobals(),
      this.printStats(),
      this.printImports(),
      this.intro,
      this.header,
      ...(await this.printPartials()),
      samples,
      this.footer,
      this.outro,
    ].join('\n'));
  }

  async write() {
    const output = await this.print();

    if (!output.trim().length) {
      return '';
    }

    if (this.check) {
      const { ex } = validateSyntax(output);
      if (ex !== null) {
        throw ex;
      }
    }

    if (this.stdout) {
      return toStdout(output);
    }

    return Promise.all([
      this.exports.length ?
        writeFileAsync(this.exportsFileName, await this.printExports()) :
        Promise.resolve(''),
      writeFileAsync(this.filename, output),
    ]);
  }
}

export default async (args) => {
  const content = await readFileAsync(args.input, 'utf-8');
  const parsed = await parse(content, {
    extractFunctions: args.export,
  });

  const test = new Test({
    ...args,
    ...parsed,
    exportsFileName: (args.output || '').replace(/\.js$/, '.exports.js'),
    target: constants[args.target] || constants.jest,
  });

  return test.write();
};
