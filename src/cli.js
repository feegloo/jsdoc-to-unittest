import fs from 'fs';
import util from 'util';
import print from './creator';
import parse from './parser';

const readFileAsync = util.promisify(fs.readFile);

// istanbul ignore next
const getInputFile = (input = process.argv[2]) => input;
// istanbul ignore next
const getOutputFile = (output = process.argv[3]) => output;

export default async (input, output) => {
  const content = await readFileAsync(getInputFile(input));
  const { imports, exports, samples } = parse(content);

  // todo: grab eslint and pass to prettifier
  return print({
    filename: getOutputFile(output),
    get stdout() {
      return this.filename === undefined || String(this.filename).trim().length === 0;
    },
    samples,
    imports,
    exports,
  });
};
