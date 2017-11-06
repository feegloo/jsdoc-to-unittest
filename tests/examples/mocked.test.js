/* global mock */
export function contains(str1, str2) { // eslint-disable-line import/prefer-default-export
  if (easy.utils.isString(str1)) { // eslint-disable-line no-undef
    return str1 && str1.indexOf(str2) !== -1;
  }
  return false;
}

global.contains = contains;

// Valid tests: 100.00%

describe('contains', () => {
  test('example 1', () => {
    expect(mock(() => contains('foo', 'fooo'), { 'easy.utils.isString(\'fooo\')': () => true }, eval)).toBe(false);
  });

  test('example 2', () => {
    expect(mock(() => contains('hey', 'ey'), { 'easy.utils.isString(\'ey\')': () => false }, eval)).toBe(false);
  });
});
