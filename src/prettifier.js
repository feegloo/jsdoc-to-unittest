import fs from 'fs';
import util from 'util';
import format from 'prettier-eslint';
import yargs from 'yargs';

yargs
  .boolean('prettify')
  .default('prettify', true);

const { argv } = yargs;

const readFileAsync = util.promisify(fs.readFile);

export default async (sourceCode) => {
  if (!argv.prettify) {
    return sourceCode;
  }

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
