import path from 'path';
import yargs from 'yargs';
import { readFileAsync } from './fs';
import print from './creator';

yargs
  .usage('Usage: $0 <command> [options]')
  .demand('input')
  .default('target', 'jest')
  .default('inline', false)
  .boolean('inline');

const { argv } = yargs;

const basePath = path.resolve(__dirname, '..');

const fields = [
  'inline',
  'target',
];

const files = [
  'mocks',
  'intro',
  'header',
  'outro',
  'footer',
];

async function getConfig(input, output = '') {
  let configPath = '';
  const config = { // default values
    export: true,
    target: 'jest',
  };
  if (typeof argv.config === 'string') {
    try {
      JSON.parse(argv.config);
    } catch (ex) {
      configPath = path.resolve(basePath, argv.config, '..');
      Object.assign(config, JSON.parse(
        await readFileAsync(path.resolve(basePath, argv.config), 'utf-8'),
      ));
    }
  }

  fields.forEach((field) => {
    if (field in argv) {
      config[field] = argv[field];
    }
  });

  Object.assign(config, {
    input,
    output,
  });

  await Promise.all(files
    .filter(key => key in argv || key in config)
    .map(async (key) => {
      config[key] = await readFileAsync(
        path.resolve(argv[key] ? basePath : configPath, config[key]),
        'utf-8',
      );
    }),
  );

  return config;
}

export default async (input = argv.input, output = argv.output) => {
  try {
    const config = await getConfig(input, output);
    return print({
      ...config,
      get stdout() {
        return output === undefined || String(output).trim().length === 0;
      },
    });
  } catch (ex) {
    console.error(ex);
    return false;
  }
};
