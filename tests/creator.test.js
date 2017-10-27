import fs from 'fs';
import util from 'util';
import path from 'path';
import create from 'src/creator';

const accessAsync = util.promisify(fs.access);
const unlinkAsync = util.promisify(fs.unlink);

describe('Creator', () => {
  test('empty', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/empty.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('karma - target', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/numeral-conjugation.js'),
      stdout: true,
      target: 'karma',
    })).toMatchSnapshot();
  });

  test('doesn\'t save empty files', async () => {
    const filePath = path.resolve(__dirname, '..', '.cache/', `trash-${Math.random().toString(36).slice(2)}.test.js`);
    await create({
      input: path.resolve(__dirname, 'fixtures/empty.js'),
      output: filePath,
    });
    try {
      await accessAsync(filePath, fs.constants.F_OK);
      await unlinkAsync(filePath);
      throw new Error('File exists');
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  test('writes to file', async () => {
    const filePath = path.resolve(__dirname, '..', '.cache/', `trash-${Math.random().toString(36).slice(2)}.test.js`);
    await create({
      input: path.resolve(__dirname, 'fixtures/contains.js'),
      output: filePath,
      export: true,
    });

    try {
      await accessAsync(filePath, fs.constants.F_OK);
      await Promise.all([
        unlinkAsync(filePath),
        unlinkAsync(filePath.replace(/\.js$/, '.exports.js')),
      ]);
    } catch (ex) {
      throw new Error('Files don\'t exist');
    }
  });

  test('writes to stdout', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/contains.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('writes to stdout #2', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/invalid-2.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('writes to stdout #3', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/each.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('handles invalid examples', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/invalid.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('mocked-easy.js', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/mocked-easy.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('async.js', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/async.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('invalid syntax', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/invalid-syntax.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('resolves async name', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/async-name-resolve.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('prevents reference errors in toBe/toEqual', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/contains-invalid-string.js'),
      stdout: true,
    })).toMatchSnapshot();
  });

  test('numeral-conjugation.js matches snapshot', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/numeral-conjugation.js'),
      stdout: true,
    })).toMatchSnapshot();
  });
});
