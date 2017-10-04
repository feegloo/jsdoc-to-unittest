import fs from 'fs';
import path from 'path';
import util from 'util';

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

export const readFile = filename => readFileAsync(path.resolve(filename), 'utf8');
export const writeFile = (filename, content) => writeFileAsync(filename, content);

export const toStdout = (output) => {
  process.stdout.write(output);
  return true;
};
