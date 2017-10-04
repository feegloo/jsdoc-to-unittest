import fs from 'fs';
import util from 'util';
import print from './creator';
import parse from './parser';

const readFileAsync = util.promisify(fs.readFile);

const getInputFile = () => process.argv[2];
const getOutputFile = () => process.argv[3];

export default async () => {
  const content = await readFileAsync(getInputFile());
  const { imports, exports, samples } = parse(content);

  print({
    filename: getOutputFile(),
    get stdout() {
      return this.filename === undefined || String(this.filename).trim().length === 0;
    },
    samples,
    imports,
    exports,
  });
};
