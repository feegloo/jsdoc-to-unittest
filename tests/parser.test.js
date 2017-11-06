import fs from 'fs';
import util from 'util';
import path from 'path';
import parse from 'src/parser';

const readFileAsync = util.promisify(fs.readFile);

describe('Parser', () => {
  test('happy path works', async () => {
    const { exports, imports, samples } = await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/contains.js'), 'utf-8'),
    );

    expect(exports).toHaveLength(1);
    expect(imports).toHaveLength(1);
    expect(Function(`${exports[0]};return ${imports[0]}`)()).toBeInstanceOf(Function);
    expect(samples).toHaveLength(1);
    expect(samples[0].examples).toHaveLength(2);
    expect(samples[0].name).toBe('contains');
    expect(samples[0].examples).toMatchSnapshot();
  });

  test('tries resolving the name', async () => {
    const { samples } = await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/contains-no-name.js'), 'utf-8'),
    );

    expect(samples[0].name).toBe('contains');
  });

  test('multiline examples', async () => {
    const { exports, imports, samples } = await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/each.js'), 'utf-8'),
    );

    expect(exports).toHaveLength(1);
    expect(imports).toHaveLength(1);
    expect(samples).toHaveLength(1);
    expect(samples[0].name).toBe('each');
    expect(samples[0].examples).toMatchSnapshot();
  });

  test('grabs @returns', async () => {
    const { samples } = await parse(`/**
     * @name contains
     *
     * @example
     * contains('hey', 'ey');
     *
     * @param str1
     * @param str2
     * @returns {*|boolean}
     */
    function contains(str1, str2) {
      return str1 && str1.indexOf(str2) !== -1;
    }`);

    expect(samples[0].examples).toEqual([
      {
        code: "contains('hey', 'ey');", name: 'contains', result: ['*', 'boolean'], type: 'instance',
      }],
    );
  });

  test('detects mocks', async () => {
    const { samples } = await parse(`/**
     * @name contains
     *
     * @example
     * contains('hey', 'ey'); // true
     * @mock { 'contains(1,2)': false }
     *
     * @param str1
     * @param str2
     * @returns {*|boolean}
     */
    function contains(str1, str2) {
      return str1 && str1.indexOf(str2) !== -1;
    }`);

    expect(samples[0].examples).toMatchSnapshot();
  });

  test('supports @async', async () => {
    expect(await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/async.js'), 'utf-8'),
    )).toMatchSnapshot();
  });

  test('detects async automatically', async () => {
    expect(await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/get-device-price.js'), 'utf-8'),
    )).toMatchSnapshot();
  });

  test('numeral-conjugation.js is parsed correctly', async () => {
    const { exports, imports, samples } = await parse(
      await readFileAsync(path.resolve(__dirname, 'fixtures/numeral-conjugation.js'), 'utf-8'),
    );

    expect(exports).toHaveLength(1);
    expect(imports).toHaveLength(1);
    expect(samples).toHaveLength(1);
    expect(samples[0].examples).toMatchSnapshot();
  });
});
