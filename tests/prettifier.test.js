import fs from 'fs';
import util from 'util';
import path from 'path';
import prettify from 'src/prettifier';

const readFileAsync = util.promisify(fs.readFile);
jest.mock('yargs');

describe('Prettifier', () => {
  const setup = [
    { prettify: true },
    {   eslint: './tests/fixtures/eslint-test-config.json' },
    { prettify: false },
  ];

  beforeEach(async () => {
    const { default: yargs } = await import('yargs');
    yargs.__setArgv(setup.shift());
  });

  test('matches snapshot', async () => {
    const content = await readFileAsync(path.resolve(__dirname, './fixtures/bad-format.js'), 'utf-8');
    expect(await prettify(content)).toMatchSnapshot();
  });

  test('accepts config', async () => {
    const content = await readFileAsync(path.resolve(__dirname, './fixtures/bad-format.js'), 'utf-8');
    expect(await prettify(content)).toMatchSnapshot();
  });

  test('doesn\'t prettify when prettify is equal to false', async () => {
    const content = await readFileAsync(path.resolve(__dirname, './fixtures/bad-format.js'), 'utf-8');
    expect(await prettify(content)).toMatchSnapshot();
  });
});
