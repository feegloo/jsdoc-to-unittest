import path from 'path';
import cli from 'src/cli';

describe('#cli', () => {
  test('creates test', async () => {
    expect(await cli(path.resolve(__dirname, './fixtures/contains.js'), '')).toMatchSnapshot();
  });

  test('creates async test', async () => {
    expect(await cli(path.resolve(__dirname, './fixtures/async.js'), '')).toMatchSnapshot();
  });

  test('array-complement.js matches snapshot', async () => {
    expect(await cli(path.resolve(__dirname, './fixtures/array-complement.js'), ''))
      .toMatchSnapshot();
  });
});
