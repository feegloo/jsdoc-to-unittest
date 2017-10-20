import { argv } from 'yargs';
import print from './creator';

export default async (input = argv._[0], output = argv._[1]) => print({
  input,
  output,
  inline: argv.inline,
  export: argv.export !== 'false',
  get stdout() {
    return output === undefined || String(output).trim().length === 0;
  },
});
