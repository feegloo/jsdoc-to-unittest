import prettify from './prettifier';
import { wrap, validateSyntax } from './utils';
import { readFile, writeFile, toStdout } from './fs';

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
    const test = this.printName(`expect(${wrap(this.code, this.mock())}).${this.renderEquality()}`);

    const { ex } = validateSyntax(test);
    if (ex) {
      return this.printError({ ex });
    }

    this.valid = true;
    return test;
  }

  tryResolving() {
    const found = [];
    const sbx = new Proxy(this.imports, {
      has: () => true,
      get(target, key) {
        if (key === Symbol.unscopables) return [];
        if (target.includes(key)) {
          found.push(key);
          return () => {};
        }

        return sbx;
      },
    });

    Function(
      's',
      `with(s){ ${this.code.toString()} }`,
    )(sbx);

    return this.code;
  }

  mock() {
    try {
      Function(this.code)();
    } catch (ex) {
      if (ex instanceof ReferenceError || ex instanceof TypeError) {
        return true;
      }
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
    return this.printName(`/*
      fixme add/fix tests
      ${ex}
      ${this.code}
    */`);
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
    return `import * as __imports__ from './${this.exportsFileName}'`;
  }

  printPartials() {
    return Promise.all([
      readFile('./src/partials/constants.js'),
      readFile('./src/partials/mock.js'),
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
    return `// Valid tests: ${((this.stats.valid / this.stats.total) * 100).toFixed(2)}%`
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
    const output = await this.print();
    if (this.stdout) {
      toStdout(prettify(`${this.printExports()}\n${output}`));
    } else {
      await writeFile(this.exportsFileName, this.printExports());
      await writeFile(this.filename, output);
    }
  }
}

export default async (args) => {
  await new Test(args).write();
};
