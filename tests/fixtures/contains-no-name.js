/**
 *
 * @example
 * contains('foo', 'fooo'); // false
 *
 * @example
 * contains('hey', 'ey'); // true;
 *
 * @param str1
 * @param str2
 * @returns {*|boolean}
 */
function contains(str1, str2) {
  return str1 && str1.indexOf(str2) !== -1;
}
