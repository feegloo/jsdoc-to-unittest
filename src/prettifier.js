import fs from 'fs';
import util from 'util';
import format from 'prettier-eslint';
import { argv } from 'yargs';

const readFileAsync = util.promisify(fs.readFile);

export default async (sourceCode) => {
  const config = {
    text: sourceCode,
  };

  if (argv.eslint) {
    Object.assign(config, {
      eslintConfig: JSON.parse(await readFileAsync(argv.eslint)),
    });
  }

  return format(config);
};
