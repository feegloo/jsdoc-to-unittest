import fs from 'fs';
import util from 'util';
import path from 'path';
import create from 'src/creator';

const readFileAsync = util.promisify(fs.readFile);
const unlinkAsync = util.promisify(fs.unlink);

describe('Creator', () => {
  test('empty', async () => {
    expect(await create({
      input: path.resolve(__dirname, 'fixtures/empty.js'),
      stdout: true,
    })).toMatchSnapshot();
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

  test('writes to file', async () => {
    const filename = 'trash-arbb88scjoshu.js';
    await create({
      input: path.resolve(__dirname, 'fixtures/contains.js'),
      output: filename,
    });

    const out = await Promise.all([
      readFileAsync(filename.replace('.js', '.exports.js'), 'utf-8'),
      readFileAsync(filename, 'utf-8'),
    ]);

    await Promise.all([
      unlinkAsync(filename.replace('.js', '.exports.js')),
      unlinkAsync(filename),
    ]);

    expect(out).toMatchSnapshot();
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
});
