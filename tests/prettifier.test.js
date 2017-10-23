import fs from 'fs';
import util from 'util';
import path from 'path';
import prettify from 'src/prettifier';
import { spawn } from 'jest-helpers/spawn';

const readFileAsync = util.promisify(fs.readFile);

describe('Prettifier', () => {
  test('matches snapshot', async () => {
    const content = await readFileAsync(path.resolve(__dirname, './fixtures/bad-format.js'), 'utf-8');
    expect(await prettify(content)).toMatchSnapshot();
  });

  test('accepts config', async () => {
    const stdout = await spawn('contains.js', '--eslint=./tests/fixtures/eslint-test-config.json');
    expect(stdout).toBe('fixme, please');
  });
});
