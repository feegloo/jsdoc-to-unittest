const path = require('path');
const util = require('util');
const fs = require('fs');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);

const babelNode = path.resolve(__dirname, '../../node_modules/.bin/babel-node');

const spawn = async (filename, ...args) => {
  const { stdout } = await execFile(babelNode, [
    path.resolve(__dirname, '../../index.js'),
    path.resolve(__dirname, '../fixtures/', filename),
    ...args,
  ], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  return stdout;
};

describe('#index', () => {
  test('example-file 1 matches snapshot', async () => {
    const stdout = await spawn('contains.js');
    expect(stdout).toMatchSnapshot();
  });

  test('jest passes', async () => {
    const name = path.resolve(__dirname, `trash-${Math.random().toString(36).slice(2)}.test.js`);
    const out = await spawn('contains.js');
    await writeFileAsync(name, out);
    let passed = true;
    try {
      await execFile(path.resolve(__dirname, '../../node_modules/.bin/jest'), [
        '--config tests/index/jest.json',
        name,
      ]);
    } catch (ex) {
      passed = ex;
    }

    await unlinkAsync(name);
    expect(passed).toBe(true);
  });

  test('jest passes async test', async () => {
    const name = path.resolve(__dirname, `trash-${Math.random().toString(36).slice(2)}.test.js`);
    const out = await spawn('async.js');
    await writeFileAsync(name, out);
    let passed = true;
    try {
      await execFile(path.resolve(__dirname, '../../node_modules/.bin/jest'), [
        '--config tests/index/jest.json',
        name,
      ]);
    } catch (ex) {
      passed = ex;
    }

    await unlinkAsync(name);
    expect(passed).toBe(true);
  });

  test('jest passes array-complement test', async () => {
    const name = path.resolve(__dirname, `trash-${Math.random().toString(36).slice(2)}.test.js`);
    const out = await spawn('array-complement.js');
    await writeFileAsync(name, out);
    let passed = true;
    try {
      await execFile(path.resolve(__dirname, '../../node_modules/.bin/jest'), [
        '--config tests/index/jest.json',
        name,
      ]);
    } catch (ex) {
      passed = ex;
    }

    await unlinkAsync(name);
    expect(passed).toBe(true);
  });
});
