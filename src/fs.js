import fs from 'fs';
import util from 'util';

export const writeFileAsync = util.promisify(fs.writeFile);
export const readFileAsync = util.promisify(fs.readFile);

export const toStdout = (output) => {
  if (process.env.NODE_ENV === 'test') {
    return output;
  }

  process.stdout.write(output);
  return true;
};
