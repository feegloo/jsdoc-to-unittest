import fs from 'fs';
import util from 'util';
import format from 'prettier-eslint';
import { argv } from 'yargs';

const readFileAsync = util.promisify(fs.readFile);

export default async (sourceCode) => {
  const options = {
    text: sourceCode,
  };

  if (argv.eslint) {
    Object.assign(options, {
      eslintConfig: JSON.parse(await readFileAsync(argv.eslint, 'utf-8')),
    });
  }

  return format(options);
};
