import fs from 'fs';
import path from 'path';
import util from 'util';
import { argv } from 'yargs';
import print from './creator';

const readFileAsync = util.promisify(fs.readFile);

const basePath = path.resolve(__dirname, '..');

const fields = [
  'inline'
];

async function getConfig(input, output) {
  let configPath = '';
  const config = { // default values
    export: true,
  };
  if (argv.config) {
    configPath = path.resolve(basePath, argv.config, '..');
    Object.assign(config, JSON.parse(
      await readFileAsync(path.resolve(basePath, argv.config), 'utf-8')
    ));
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

  if (argv.header) {
    config.header = await readFileAsync(path.resolve(basePath, config.header), 'utf-8');
  } else if (config.header) {
    config.header = await readFileAsync(path.resolve(configPath, config.header), 'utf-8');
  }
  if (argv.footer) {
    config.footer = await readFileAsync(path.resolve(basePath, config.footer), 'utf-8');
  } else if (config.footer) {
    config.footer = await readFileAsync(path.resolve(configPath, config.footer), 'utf-8');
  }

  return config;
}

export default async (input = argv._[0], output = argv._[1]) => {
  const config = await getConfig(input, output);
  return print({
    ...config,
    get stdout() {
      return output === undefined || String(output).trim().length === 0;
    },
  });
};
