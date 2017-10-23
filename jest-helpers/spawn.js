const path = require('path');
const util = require('util');
const fs = require('fs');
const childProcess = require('child_process');

const execFile = util.promisify(childProcess.execFile);

const babelNode = path.resolve(__dirname, '../node_modules/.bin/babel-node');

exports.spawn = async (filename, ...args) => {
  const { stdout } = await execFile(babelNode, [
    path.resolve(__dirname, '../index.js'),
    path.resolve(__dirname, '../tests/fixtures/', filename),
    ...args,
  ], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  return stdout;
};
