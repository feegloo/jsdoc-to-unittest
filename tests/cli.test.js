import path from 'path';
import cli from 'src/cli';

describe('#cli', () => {
  test('creates test', async () => {
    expect(await cli(path.resolve(__dirname, './fixtures/contains.js'), '')).toMatchSnapshot();
  });
});
