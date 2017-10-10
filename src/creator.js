import prettify from './prettifier';
import { wrap, validateSyntax } from './utils';
import { writeFile, toStdout } from './fs';

class TestItem {
  constructor({
    name,
    code,
    type,
    result,
    imports,
  }) {
    this.name = name;
    this.code = code;
    this.type = type || code.includes('return') ? '' : 'no-throw';
    this.result = result;
    this.imports = imports;
    this.valid = false;
    this.output = this.print();
  }

  printName(code) {
    return `test('${this.name}', () => {
      ${code}
    })`;
  }

  renderEquality() {
    switch (this.type) {
      case 'instance':
        return `toBeInstanceOf(${this.result}); // fixme: could be replaced with something more specific`;
      case 'value':
        return `toBe(${this.result});`;
      case 'no-throw':
        return 'not.toThrow();';
      default:
        return `toEqual(${this.result});`;
    }
  }

  print() {
    const test = this.printName(`expect(${wrap(this.code, this.undefined)}).${this.renderEquality()}`);

    const { ex } = validateSyntax(test);
    if (ex) {
      return this.printError({ ex });
    }

    this.valid = true;
    return test;
  }

  get undefined() {
    try {
      Function(this.imports.join(','), this.code)();
    } catch (ex) {
      return ex instanceof ReferenceError || (ex instanceof TypeError && ex.message.includes('null or undefined'));
    }

    return false;
  }

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'string':
        return this.output;
      default:
        return Object.prototype.toString.call(this);
    }
  }

  printError({ ex }) {
    return this.printName(`throw new ${ex.constructor.name}('${ex.message}');\n/*${this.code}*/`);
  }
}

class Test {
  constructor({
    filename = '',
    stdout,
    samples,
    imports,
    exports,
  }) {
    this.filename = filename;
    this.exportsFileName = filename.replace(/\.js$/, '.exports.js');
    this.stdout = stdout;
    this.samples = samples;
    this.imports = imports;
    this.exports = exports;
    this.stats = {
      total: 0,
      valid: 0,
    };
  }

  printImports() {
    if (this.stdout) return '';
    // return `import {
    //   ${this.imports.map(name => name).join(',\n')}
    // } from './${this.exportsFileName}';
    // `;
    return `import * as __imports__ from './${this.exportsFileName}';\nglobal.__imports__ = __imports__;\n`;
  }

  printPartials() {
    return Promise.all([
      // readFile('./src/partials/constants.js'),
      // readFile('./src/partials/mock.js'),
    ]);
  }

  printExports() {
    return prettify([
      this.exports.map(func => `export ${func}`).join('\n\n'),
      ';',
    ].join('\n'));
  }

  printSample({ examples, name = (examples[0] || []).name }) {
    if (!examples.length) return '';
    const tests = examples.map((args, i) => {
      const item = new TestItem({ imports: this.imports, ...args, name: `example ${i + 1}` });
      this.stats.total += 1;
      if (item.valid) {
        this.stats.valid += 1;
      }
      return String(item);
    }).join('\n\n');

    return `describe('${name}', () => {
      ${tests}
    });`;
  }

  printStats() {
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
      output = ex.toString();
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
