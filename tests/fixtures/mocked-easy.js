/**
 * @name contains
 *
 * @example
 * contains('foo', 'fooo'); // false
 *
 * @mock
 * { 'easy.utils.isString(1)': true }
 *
 * @example
 * contains('hey', 'ey'); // true;
 *
 * @mock
 * { 'easy.utils.isString(1)': true }
 *
 * @param str1
 * @param str2
 * @returns {*|boolean}
 */
function contains(str1, str2) {
  if (easy.utils.isString(str1)) {
    return str1 && str1.indexOf(str2) !== -1;
  }

  return false;
}
