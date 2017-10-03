const fs = require('fs');
const util = require('util');
const { default: create, createImports, createExports } = require('./creator');
const { default: parse } = require('./parser');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const getInputFile = () => process.argv[2];
const getOutputFile = () => process.argv[3];

module.exports = async () => {
  const content = await readFileAsync(getInputFile());
  const { imports, exports, samples } = parse(content);
  const output = getOutputFile();
  const tests = [createImports(imports, output), create(samples)].join('\n');
  const exportsFile = createExports(exports);
  if (!output) {
    process.stdout.write(`${exportsFile} ${tests}`);
  } else {
    await writeFileAsync(output.replace(/\.js$/, '.exports.js'), exportsFile);
    await writeFileAsync(output, tests);
  }
};
