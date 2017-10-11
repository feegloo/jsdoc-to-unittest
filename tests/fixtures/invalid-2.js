/**
 *
 * @example
 * mayContain('foo', 'fooo'); // true or false
 *
 *
 * @param str1
 * @param str2
 * @returns {Boolean}
 */
function mayContain(str1, str2) {
  return str1 && str1.indexOf(str2) !== -1;
}
