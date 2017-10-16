import fs from 'fs';
import util from 'util';
import path from 'path';
import create from 'src/creator';
import parse from 'src/parser';

const readFileAsync = util.promisify(fs.readFile);
const unlinkAsync = util.promisify(fs.unlink);

describe('Creator', () => {
  test('empty', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      ...parse(''),
    })).toMatchSnapshot();
  });

  test('fail', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      ...parse(''),
      samples: null,
    })).toMatchSnapshot();
  });

  test('write to stdout', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/contains.js'), 'utf-8'),
      ),
    })).toMatchSnapshot();
  });

  test('write to stdout #2', async () => {
    expect(await create({
      stdout: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/invalid-2.js'), 'utf-8'),
      ),
    })).toMatchSnapshot();
  });

  test('write to stdout #3', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/each.js'), 'utf-8'),
      ),
    })).toMatchSnapshot();
  });

  test('write to stdout #4', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      imports: ['contains'],
      exports: ['function contains(){}'],
      samples: [
        { examples: [] },
      ],
    })).toMatchSnapshot();
  });

  test('handles invalid examples', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/invalid.js'), 'utf-8'),
      ),
    })).toMatchSnapshot();
  });

  test('writes to file', async () => {
    const filename = 'trash-arbb88scjoshu.js';
    await create({
      filename,
      stdout: false,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/contains.js'), 'utf-8'),
      ),
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

  test('writes to file - named imports', async () => {
    const filename = 'trash-ar88scjoshu.js';
    await create({
      filename,
      stdout: false,
      namedImports: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/contains.js'), 'utf-8'),
      ),
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

  test('mocked', async () => {
    expect(await create({
      filename: '',
      stdout: true,
      namedImports: true,
      ...parse(
        await readFileAsync(path.resolve(__dirname, 'fixtures/mocked-easy.js'), 'utf-8'),
      ),
    })).toMatchSnapshot();
  });

  test('async', async () => {

  });
});
