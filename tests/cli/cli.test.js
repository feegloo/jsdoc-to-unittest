const path = require('path');
const util = require('util');
const fs = require('fs');
const child_process = require('child_process');

const execFile = util.promisify(child_process.execFile);
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);

const babelNode = path.resolve(__dirname, '../../node_modules/.bin/babel-node');

const spawn = async (filename, ...args) => {
  const { stdout } = await execFile(babelNode, [
    path.resolve(__dirname, '../../index.js'),
    path.resolve(__dirname, './fixtures/', filename),
    ...args,
  ]);

  return stdout;
};

describe('#cli', () => {
  test('example-file 1 matches snapshot', async () => {
    const stdout = await spawn('example-file1.js');
    expect(stdout).toMatchSnapshot();
  });

  test('jest passes', async () => {
    const name = path.resolve(__dirname, `${Math.random().toString(36).slice(2)}.test.js`);
    const out = await spawn('example-file1.js');
    await writeFileAsync(name, out);
    let passed = true;
    try {
      await execFile(babelNode, [
        path.resolve(__dirname, '../../node_modules/.bin/jest'),
        name,
      ]);
    } catch (ex) {
      passed = ex;
    }

    await unlinkAsync(name);
    expect(passed).toBe(true);
  });
});
