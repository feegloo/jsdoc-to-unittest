import prettify from './prettifier';
import { wrap, validateSyntax } from './utils';
import { readFile, writeFile, toStdout } from './fs';

class TestItem {
  constructor({
    async,
    name,
    code,
    type,
    result,
    imports,
    mocks,
  }) {
    this.async = async;
    this.name = name;
    this.code = code;
    this.type = type;
    this.result = result;
    this.imports = imports;
    this.mocks = JSON.stringify(mocks);
    this.mockName = async ? 'mock.async' : 'mock';
    this.valid = false;
    this.output = this.print();
  }

  printName(code) {
    return `test('${this.name}', ${this.async ? 'async ' : ''}() => {
      ${code}
    })`;
  }

  renderEquality() {
    if (this.type !== 'no-throw' && typeof this.result === 'string' && !this.result.length) {
      this.type = 'no-throw';
      return this.renderEquality();
    }

    switch (this.type) {
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
    if (validateSyntax(this.renderEquality()).ex !== null) {
      this.type = 'no-throw';
    }

    const wrapped = wrap(this.code, this.mocks, this.mockName);
    const code = `expect(${this.async ? 'await ' : ''}${wrapped}).${this.renderEquality()}`;
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
    filename = '',
    stdout,
    samples,
    imports,
    exports,
    async,
    partials = [],
  }) {
    this.filename = filename;
    const splitFilename = filename.split('/');
    this.exportsFileName = splitFilename[splitFilename.length - 1].replace(/\.js$/, '.exports.js');
    this.stdout = stdout;
    this.samples = samples;
    this.imports = imports;
    this.exports = exports;
    this.partials = partials;
    this.async = async;
    this.stats = {
      total: 0,
      valid: 0,
    };
  }

  printImports() {
    if (this.stdout) return '';
    return `import __imports__, {
       ${this.imports.join(',\n')}
      } from './${this.exportsFileName}';
      
      global.__imports__ = __imports__;
      Object.assign(global, __imports__);
      `;
  }

  printPartials() {
    return Promise.all(this.partials.map(partial => readFile(partial)));
  }

  printExports() {
    if (!this.imports.length) {
      return '';
    }

    return prettify([
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

  async print() {
    const samples = this.samples.map(this.printSample, this).join('\n');
    return prettify([
      this.printStats(),
      this.printImports(),
      ...(await this.printPartials()),
      samples,
    ].join('\n'));
  }

  async write() {
    let output = '';
    try {
      output = await this.print();
    } catch (ex) {
      output = JSON.stringify(ex.message.toString());
    }

    if (this.stdout) {
      return toStdout(prettify(`${this.printExports()}\n${output}`));
    }

    return Promise.all([
      writeFile(this.exportsFileName, this.printExports()),
      writeFile(this.filename, output),
    ]);
  }
}

export default async (args) => {
  const test = new Test(args);
  // todo: move (from cli) readFile here etc...
  return test.write();
};
