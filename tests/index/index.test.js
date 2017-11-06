const { spawn, spawnJest } = require('jest-helpers/spawn');

describe('#index', () => {
  test('contains.js matches snapshot', async () => {
    expect(
      await spawn('bin/generate', '--input=tests/fixtures/contains.js'),
    ).toMatchSnapshot();
  });

  test('jest passes', async () => {
    expect(
      await spawnJest('--input=tests/fixtures/contains.js'),
    ).not.toBeInstanceOf(Error);
  });

  test('jest passes async test', async () => {
    expect(
      await spawnJest('--input=tests/fixtures/async.js'),
    ).not.toBeInstanceOf(Error);
  });

  test('jest passes get-device-price.js', async () => {
    expect(
      await spawnJest('--input=tests/fixtures/async.js'),
    ).not.toBeInstanceOf(Error);
  });

  test('jest passes array-complement test', async () => {
    expect(
      await spawnJest('--input=tests/fixtures/array-complement.js'),
    ).not.toBeInstanceOf(Error);
  });
});
