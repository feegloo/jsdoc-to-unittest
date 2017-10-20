import fs from 'fs';
import util from 'util';
import path from 'path';
import prettify from 'src/prettifier';

const readFileAsync = util.promisify(fs.readFile);

describe('Prettifier', () => {
  test('matches snapshot', async () => {
    const content = await readFileAsync(path.resolve(__dirname, './fixtures/bad-format.js'), 'utf-8');
    expect(await prettify(content)).toMatchSnapshot();
  });
});
