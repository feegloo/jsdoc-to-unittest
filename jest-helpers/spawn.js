const path = require('path');
const util = require('util');
const fs = require('fs');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);

const basePath = path.resolve(__dirname, '..');

const getBinFromModules = command => path.resolve(basePath, `node_modules/.bin/${command}`);

exports.getBinFromModules = getBinFromModules;

const spawn = async function (command, ...args) {
  const { stdout, stderr } = await execFile(
    command, args, {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        ...(this || {}),
      },
    },
  );

  if (stderr) {
    throw stderr;
  }

  return stdout;
};

exports.spawn = spawn;

exports.spawnJest = async (...args) => {
  const filePath = path.resolve(basePath, '.cache/', `trash-${Math.random().toString(36).slice(2)}.test.js`);
  await spawn('bin/generate', ...args, `--output=${filePath}`);
  let result = null;
  try {
    result = await spawn.call({ NODE_ENV: 'test' }, 'jest', `--config=${path.resolve(basePath, 'tests/index/jest.json')}`, filePath);
  } catch (ex) {
    result = ex;
  }

  await unlinkAsync(filePath);
  return result;
};
