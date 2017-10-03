const path = require('path');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

const spawn = async (filename) => {
  const { stdout } = await execFile('node', [
    path.resolve(__dirname, '../../index.js'),
    path.resolve(__dirname, './fixtures/', filename),
  ]);

  return stdout;
};

describe('#cli', () => {
  test('example-file 1 matches snapshot', async () => {
    const stdout = await spawn('example-file1.js');
    expect(stdout).toMatchSnapshot();
  });

  // test('jest passes', () => {
  //
  // });
});
